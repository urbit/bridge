import Tx from 'ethereumjs-tx';
import * as azimuth from 'azimuth-js';
import * as tank from './tank';

import { hexify } from './txn';
import {
  deriveNetworkSeedFromUrbitWallet,
  deriveNetworkKeys,
  CRYPTO_SUITE_VERSION,
} from './keys';
import { addHexPrefix } from './wallet';
import { sendAndAwaitAll } from './txn';
import getSuggestedGasPrice from './getSuggestedGasPrice';
import { GAS_LIMITS } from './constants';
import { toWei, toBN } from 'web3-utils';

// the initial network key revision is always 1
const INITIAL_NETWORK_KEY_REVISION = 1;

export const TRANSACTION_PROGRESS = {
  GENERATING: 0.01,
  SIGNING: 0.15,
  FUNDING: 0.3,
  TRANSFERRING: 0.55,
  CLEANING: 0.95,
  DONE: 1.0,
};

export async function reticketPointBetweenWallets({
  fromWallet,
  toWallet,
  point,
  web3,
  contracts,
  networkType,
  onUpdate,
  transferEth = false,
  nextRevision = INITIAL_NETWORK_KEY_REVISION,
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

  progress(TRANSACTION_PROGRESS.GENERATING);

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
  const seed = await deriveNetworkSeedFromUrbitWallet(toWallet, nextRevision);

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
    CRYPTO_SUITE_VERSION,
    /* discontinuous */ false
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

  progress(TRANSACTION_PROGRESS.SIGNING);

  const suggestedGasPrice = await getSuggestedGasPrice(networkType);
  const gasPrice = toWei(suggestedGasPrice.toFixed(), 'gwei');
  const gasPriceBN = toBN(gasPrice);
  let totalCost = toBN(0);
  let inviteNonce = await web3.eth.getTransactionCount(fromWallet.address);
  txs = txs.map(tx => {
    tx.from = fromWallet.address;
    tx.nonce = inviteNonce++;
    tx.gasPrice = gasPriceBN;
    totalCost = totalCost.add(gasPriceBN.mul(toBN(tx.gas)));
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

  progress(TRANSACTION_PROGRESS.FUNDING);

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

  progress(TRANSACTION_PROGRESS.TRANSFERRING);

  await sendAndAwaitAll(web3, txPairs.map(p => p.signed), usedTank);

  //
  // move leftover eth
  //

  progress(TRANSACTION_PROGRESS.CLEANING);

  // if non-trivial eth left in invite wallet, transfer to new ownership
  let balance = toBN(await web3.eth.getBalance(fromWallet.address));
  const gasLimit = GAS_LIMITS.SEND_ETH;
  const sendEthCost = gasPriceBN.mul(toBN(gasLimit));
  if (transferEth && balance.gt(sendEthCost)) {
    const value = balance.sub(sendEthCost);
    const tx = {
      to: toWallet.ownership.keys.address,
      value: value,
      gasPrice: gasPriceBN,
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

  progress(TRANSACTION_PROGRESS.DONE);
}
