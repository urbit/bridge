import Tx from 'ethereumjs-tx';
import * as azimuth from 'azimuth-js';
import * as wg from './walletgen';
import * as tank from './tank';

import JSZip from 'jszip';
import saveAs from 'file-saver';

import { hexify } from './txn';
import { deriveNetworkSeedFromUrbitWallet, deriveNetworkKeys } from './keys';
import { addHexPrefix } from './wallet';
import { sendAndAwaitAll } from './txn';
import { GAS_LIMITS } from './constants';

// the initial network key revision is always 1
const INITIAL_NETWORK_KEY_REVISION = 1;

const TRANSACTION_STATES = {
  GENERATING: {
    label: 'Generating Transactions...',
    progress: 0.0,
  },
  SIGNING: {
    label: 'Signing Transactions...',
    progress: 0.15,
  },
  FUNDING: {
    label: 'Funding Transactions...',
    progress: 0.3,
  },
  TRANSFERRING: {
    label: 'Transferring Point...',
    progress: 0.55,
  },
  CLEANING: {
    label: 'Cleaning Up...',
    progress: 0.95,
  },
  DONE: {
    label: 'Done',
    progress: 1.0,
  },
};

export async function generateWallet(point) {
  const ticket = await wg.makeTicket(point);
  const wallet = await wg.generateWallet(point, ticket);
  return wallet;
}

//TODO should be moved to lib/walletgen
export async function downloadWallet(paper) {
  return new Promise((resolve, reject) => {
    const zip = new JSZip();
    //TODO the categories here aren't explained in bridge at all...

    const bin0 = paper.filter(item => item.bin === '0');
    const bin1 = paper.filter(item => item.bin === '1');
    const bin2 = paper.filter(item => item.bin === '2');
    const bin3 = paper.filter(item => item.bin === '3');
    const bin4 = paper.filter(item => item.bin === '4');

    const bin0Folder = zip.folder('0. Public');
    const bin1Folder = zip.folder('1. Very High Friction Custody');
    const bin2Folder = zip.folder('2. High Friction Custody');
    const bin3Folder = zip.folder('3. Medium Friction Custody');
    const bin4Folder = zip.folder('4. Low Friction Custody');

    bin0.forEach(item => bin0Folder.file(`${item.pageTitle}.png`, item.png));
    bin1.forEach(item => bin1Folder.file(`${item.pageTitle}.png`, item.png));
    bin2.forEach(item => bin2Folder.file(`${item.pageTitle}.png`, item.png));
    bin3.forEach(item => bin3Folder.file(`${item.pageTitle}.png`, item.png));
    bin4.forEach(item => bin4Folder.file(`${item.pageTitle}.png`, item.png));

    zip.generateAsync({ type: 'blob' }).then(content => {
      saveAs(content, 'urbit-wallet.zip');
      resolve(true);
    });
  });
}

export async function reticketPointBetweenWallets({
  fromWallet,
  toWallet,
  point,
  web3,
  contracts,
  onUpdate,
  transferEth = false,
}) {
  const askForFunding = (address, minBalance, balance) =>
    onUpdate({
      type: 'askFunding',
      value: { address, minBalance, balance },
    });

  const gotFunding = () => onUpdate({ type: 'gotFunding' });
  const progress = state => onUpdate({ type: 'progress', state });

  //
  // generate transactions
  //

  progress(TRANSACTION_STATES.GENERATING);

  // transfer to invite wallet, so it can configure
  //NOTE doing this in the invite wallet instead of the final wallet makes
  //     failure cases "solvable" by just telling the user to fully retry.
  //     in other words, the invite flow is effectively idempotent.

  //TODO no harm done if we already owned it, but should still get a bool arg
  //     for skipping this, if it isn't too big a burden for callers
  const transferTmpTx = azimuth.ecliptic.transferPoint(
    contracts,
    point,
    fromWallet.address,
    false
  );
  transferTmpTx.gas = GAS_LIMITS.TRANSFER;

  // configure networking public keys
  const seed = await deriveNetworkSeedFromUrbitWallet(
    toWallet,
    INITIAL_NETWORK_KEY_REVISION
  );

  const networkSeed = seed.matchWith({
    Nothing: () => {
      throw new Error('network seed not derived');
    },
    Just: p => p.value,
  });

  const networkKeys = deriveNetworkKeys(networkSeed);

  const keysTx = azimuth.ecliptic.configureKeys(
    contracts,
    point,
    addHexPrefix(networkKeys.crypt.public),
    addHexPrefix(networkKeys.auth.public),
    1,
    false
  );
  keysTx.gas = GAS_LIMITS.CONFIGURE_KEYS;

  // configure management proxy

  const managementTx = azimuth.ecliptic.setManagementProxy(
    contracts,
    point,
    toWallet.management.keys.address
  );
  managementTx.gas = GAS_LIMITS.SET_PROXY;

  // set spawn & voting proxies situationally

  let txs = [transferTmpTx, keysTx, managementTx];
  if (
    azimuth.azimuth.getPointSize(point) !== azimuth.azimuth.PointSize.Planet
  ) {
    const spawnTx = azimuth.ecliptic.setSpawnProxy(
      contracts,
      point,
      toWallet.spawn.keys.address
    );
    spawnTx.gas = GAS_LIMITS.SET_PROXY;
    txs.push(spawnTx);

    if (
      azimuth.azimuth.getPointSize(point) === azimuth.azimuth.PointSize.Galaxy
    ) {
      const votingTx = azimuth.ecliptic.setVotingProxy(
        contracts,
        point,
        toWallet.voting.keys.address
      );
      votingTx.gas = GAS_LIMITS.SET_PROXY;
      txs.push(votingTx);
    }
  }

  // transfer configured point to user's new wallet

  const transferFinalTx = azimuth.ecliptic.transferPoint(
    contracts,
    point,
    toWallet.ownership.keys.address,
    false
  );
  transferFinalTx.gas = GAS_LIMITS.TRANSFER;
  txs.push(transferFinalTx);

  //
  // finalizing & signing transactions
  //

  progress(TRANSACTION_STATES.SIGNING);

  let totalCost = 0;
  let inviteNonce = await web3.eth.getTransactionCount(fromWallet.address);
  txs = txs.map(tx => {
    tx.from = fromWallet.address;
    tx.nonce = inviteNonce++;
    tx.gasPrice = 20000000000; //NOTE we pay the premium for faster ux
    totalCost = totalCost + tx.gasPrice * tx.gas;
    return tx;
  });

  let txPairs = txs.map(tx => {
    let stx = new Tx(tx);
    stx.sign(Buffer.from(fromWallet.privateKey, 'hex'));
    return {
      raw: hexify(stx.serialize()),
      signed: stx,
    };
  });

  //
  // ensuring funding for transactions
  //

  progress(TRANSACTION_STATES.FUNDING);

  const usedTank = await tank.ensureFundsFor(
    web3,
    point,
    fromWallet.address,
    totalCost,
    txPairs.map(p => p.raw),
    askForFunding,
    gotFunding
  );

  //
  // sending and awaiting transactions
  //

  progress(TRANSACTION_STATES.TRANSFERRING);

  await sendAndAwaitAll(web3, txPairs.map(p => p.signed), usedTank);

  //
  // move leftover eth
  //

  progress(TRANSACTION_STATES.CLEANING);

  // if non-trivial eth left in invite wallet, transfer to new ownership
  let balance = await web3.eth.getBalance(fromWallet.address);
  const gasPrice = 20000000000;
  const gasLimit = 21000;
  const sendEthCost = gasPrice * gasLimit;
  if (transferEth && balance > sendEthCost) {
    const value = balance - sendEthCost;
    const tx = {
      to: toWallet.ownership.keys.address,
      value: value,
      gasPrice: gasPrice,
      gas: gasLimit,
      nonce: inviteNonce++,
    };
    let stx = new Tx(tx);
    stx.sign(fromWallet.privateKey);
    const rawTx = hexify(stx.serialize());
    web3.eth.sendSignedTransaction(rawTx).catch(err => {
      console.log('error sending value tx, who cares', err);
    });
  }

  progress(TRANSACTION_STATES.DONE);
}
