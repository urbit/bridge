import { Just, Nothing } from 'folktale/maybe'
import Tx from 'ethereumjs-tx'

import * as azimuth from 'azimuth-js'
import * as kg from '../../../node_modules/urbit-key-generation/dist/index'
import * as wg from '../../walletgen/lib/lib.js'
import * as tank from './tank'

import JSZip from 'jszip'
import saveAs from 'file-saver'

import {
  waitForTransactionConfirm,
  isTransactionConfirmed
} from './txn'
import { BRIDGE_ERROR } from './error'
import { attemptSeedDerivation } from './keys'
import {
  addressFromSecp256k1Public,
  addHexPrefix,
  WALLET_NAMES
} from './wallet'

const INVITE_STAGES = {
  INVITE_LOGIN: "invite login",
  INVITE_WALLET: "invite wallet",
  INVITE_VERIFY: "invite verify",
  INVITE_TRANSACTIONS: "invite transactions"
}

const WALLET_STATES = {
  UNLOCKING: "Unlocking invite wallet",
  GENERATING: "Generating your wallet",
  RENDERING: "Creating paper collateral",
  PAPER_READY: "Download your wallet",
  DOWNLOADED: "Wallet downloaded",
  TRANSACTIONS: "Sending transactions"
}

const TRANSACTION_STATES = {
  GENERATING: {
    label: 'Generating transactions',
    pct: "0%"
  },
  SIGNING: {
    label: 'Signing transactions',
    pct: "15%"
  },
  FUNDING_INVITE: {
    label: 'Funding invite wallet',
    pct: "30%"
  },
  CLAIMING: {
    label: 'Claiming invite',
    pct: "55%"
  },
  FUNDING_RECIPIENT: {
    label: 'Funding recipient wallet',
    pct: "65%"
  },
  CONFIGURING: {
    label: 'Configuring planet',
    pct: "85%"
  },
  CLEANING: {
    label: 'Cleaning up',
    pct: "95%"
  },
  DONE: {
    label: 'Done',
    pct: "100%"
  },
}

async function generateWallet(point) {
  const ticket = await wg.makeTicket(point);
  const wallet = await wg.generateWallet(point, ticket);
  return wallet;
}

//TODO should be moved to lib/walletgen
async function downloadWallet(paper) {
  return new Promise((resolve, reject) => {
    const zip = new JSZip();
    //TODO the categories here aren't explained in bridge at all...

    const bin0 = paper.filter(item => item.bin === '0');
    const bin1 = paper.filter(item => item.bin === '1');
    const bin2 = paper.filter(item => item.bin === '2');
    const bin3 = paper.filter(item => item.bin === '3');
    const bin4 = paper.filter(item => item.bin === '4');

    const bin0Folder = zip.folder("0. Public");
    const bin1Folder = zip.folder("1. Very High Friction Custody");
    const bin2Folder = zip.folder("2. High Friction Custody");
    const bin3Folder = zip.folder("3. Medium Friction Custody");
    const bin4Folder = zip.folder("4. Low Friction Custody");

    bin0.forEach(item => bin0Folder.file(`${item.pageTitle}.png`, item.png))
    bin1.forEach(item => bin1Folder.file(`${item.pageTitle}.png`, item.png));
    bin2.forEach(item => bin2Folder.file(`${item.pageTitle}.png`, item.png));
    bin3.forEach(item => bin3Folder.file(`${item.pageTitle}.png`, item.png));
    bin4.forEach(item => bin4Folder.file(`${item.pageTitle}.png`, item.png));

    zip.generateAsync({type:"blob"}).then((content) => {
      saveAs(content, 'urbit-wallet.zip');
      resolve(true)
    });
  })
}

async function startTransactions(args) {
  let { realPointM, web3M, contractsM,
    inviteWalletM, realWalletM, setUrbitWallet, updateProgress } = args

  const askForFunding = (address, amount, current) => {
    updateProgress({
      type: "notify",
      value: `Please make sure ${address} has at least ${amount} wei, we'll continue once that's true. Current balance: ${current}. Waiting`
    });
  }

  if (Nothing.hasInstance(web3M)) {
    throw BRIDGE_ERROR.MISSING_WEB3;
  }
  const web3 = web3M.value;

  if (Nothing.hasInstance(contractsM)) {
    throw BRIDGE_ERROR.MISSING_CONTRACTS;
  }
  const contracts = contractsM.value;

  if (Nothing.hasInstance(inviteWalletM)) {
    throw BRIDGE_ERROR.MISSING_WALLET;
  }
  const inviteWallet = inviteWalletM.value;

  if (Nothing.hasInstance(realWalletM)) {
    throw BRIDGE_ERROR.MISSING_WALLET;
  }
  const realWallet = realWalletM.value;

  // const realWallet = await urbitWalletFromTicket(args.realTicket, point);

  if (Nothing.hasInstance(realPointM)) {
    throw BRIDGE_ERROR.MISSING_POINT;
  }
  const point = realPointM.value;

  const inviteAddress = inviteWallet.address;
  console.log('working as', inviteAddress);

  // transfer from invite wallet to new wallet

  let transferTx = azimuth.ecliptic.transferPoint(contracts, point, realWallet.ownership.keys.address);
  transferTx.gas = 500000; //TODO can maybe be lower?

  // ping gas tank with txs if needed

  let inviteNonce = await web3.eth.getTransactionCount(inviteAddress);
  transferTx.nonce = inviteNonce++;
  transferTx.gasPrice = 20000000000; //NOTE we pay the premium for faster ux
  transferTx.from = inviteAddress;

  //NOTE using web3.eth.accounts.signTransaction is broken (1.0.0-beta51)
  let transferStx = new Tx(transferTx);
  transferStx.sign(inviteWallet.privateKey);
  let rawTransferStx = '0x'+transferStx.serialize().toString('hex');

  const transferCost = transferTx.gas * transferTx.gasPrice;
  updateProgress({
    type: "progress",
    value: TRANSACTION_STATES.FUNDING_INVITE
  });
  await tank.ensureFundsFor(web3, point, inviteAddress, transferCost, [rawTransferStx], askForFunding);

  updateProgress({
    type: "progress",
    value: TRANSACTION_STATES.CLAIMING
  });

  // send transaction
  await sendAndAwaitConfirm(web3, [rawTransferStx]);

  //
  // we're gonna be operating as the new wallet from here on out, so change
  // the relevant values
  //
  setUrbitWallet(Just(realWallet));
  const newAddress = realWallet.ownership.keys.address;

  // configure management proxy

  let managementTx = azimuth.ecliptic.setManagementProxy(contracts, point, realWallet.management.keys.address);
  managementTx.gas = 200000;
  managementTx.nonce = 0;

  // configure networking public keys
  //TODO feels like more of this logic should live in a lib?
  let networkSeed = await attemptSeedDerivation(true, {
    walletType: WALLET_NAMES.TICKET,
    urbitWallet: Just(realWallet),
    pointCursor: Just(point),
    pointCache: {[point]: {keyRevisionNumber: 0}}
  });
  if (Nothing.hasInstance(networkSeed)) {
    throw new Error('wtf network seed not derived');
  }
  networkSeed = networkSeed.value;
  const networkKeys = kg.deriveNetworkKeys(networkSeed);

  let keysTx = azimuth.ecliptic.configureKeys(
    contracts,
    point,
    addHexPrefix(networkKeys.crypt.public),
    addHexPrefix(networkKeys.auth.public),
    1,
    false
  );
  keysTx.gas = 150000;
  keysTx.nonce = 1;

  //TODO  refactor this process into function
  let totalCost = 0;
  let txs = [managementTx, keysTx];
  txs = txs.map(tx => {
    tx.gasPrice = 20000000000;
    tx.from = newAddress;
    totalCost = totalCost + (tx.gasPrice * tx.gas);
    return tx;
  });

  let rawStxs = txs.map(tx => {
    let stx = new Tx(tx);
    stx.sign(Buffer.from(realWallet.ownership.keys.private, 'hex'));
    return '0x'+stx.serialize().toString('hex');
  });

  updateProgress({
    type: "progress",
    value: TRANSACTION_STATES.FUNDING_RECIPIENT
  });
  await tank.ensureFundsFor(web3, point, newAddress, totalCost, rawStxs, askForFunding);

  updateProgress({
    type: "progress",
    value: TRANSACTION_STATES.CONFIGURING
  });

  await sendAndAwaitConfirm(web3, rawStxs);

  updateProgress({
    type: "progress",
    value: TRANSACTION_STATES.CLEANING
  });

  // if non-trivial eth left in invite wallet, transfer to new ownership
  let balance = await web3.eth.getBalance(inviteAddress);
  const gasPrice = 20000000000;
  const gasLimit = 21000;
  const sendEthCost = gasPrice * gasLimit;
  if (balance > sendEthCost) {
    const value = (balance - sendEthCost);
    console.log('sending', value);
    const tx = {
      to: newAddress,
      value: value,
      gasPrice: gasPrice,
      gas: gasLimit,
      nonce: inviteNonce++
    }
    let stx = new Tx(tx);
    stx.sign(inviteWallet.privateKey);
    const rawTx = '0x'+stx.serialize().toString('hex');
    web3.eth.sendSignedTransaction(rawTx).catch(err => {
      console.log('error sending value tx, who cares', err);
    });
    console.log('sent old balance');
  }

  updateProgress({
    type: "progress",
    value: TRANSACTION_STATES.DONE
  });

  // proceed without waiting for confirm
  setUrbitWallet(Just(realWallet));
}

//TODO replace with txn.sendSignedTransaction? it can doubt nonce errors too
async function sendAndAwaitConfirm(web3, signedTxs) {
  await Promise.all(signedTxs.map(tx => {
    console.log('sending...');
    return new Promise((resolve, reject) => {
      web3.eth.sendSignedTransaction(tx).then(res => {
        console.log('sent, now waiting for confirm!', res.transactionHash);
        waitForTransactionConfirm(web3, res.transactionHash)
        .then(resolve);
      }).catch(async err => {
        // if there's an error, check if it's because the transaction was
        // already confirmed prior to sending.
        // this is really only the case in local dev environments.
        const txHash = web3.utils.keccak256(tx);
        console.log(err.message);
        if (err.message.includes("the tx doesn't have the correct nonce.")) {
          console.log('nonce error, awaiting confirm', err.message.slice(55));
          //TODO max wait time before assume failure?
          let res = await waitForTransactionConfirm(web3, txHash);
          if (res) resolve();
          else reject(new Error('Unexpected tx failure'));
        } else {
          const confirmed = await isTransactionConfirmed(web3, txHash);
          console.log('error, but maybe confirmed:', confirmed);
          if (confirmed) resolve();
          else reject(err);
        }
      });
    });
  }));
}

export {
  generateWallet,
  downloadWallet,
  startTransactions,
  INVITE_STAGES,
  WALLET_STATES,
  TRANSACTION_STATES
}
