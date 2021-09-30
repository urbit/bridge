import * as azimuth from 'azimuth-js';
import * as tank from './tank';

import { hexify } from './txn';
import {
  deriveNetworkSeedFromUrbitWallet,
  deriveNetworkKeys,
  CRYPTO_SUITE_VERSION,
} from './keys';
import { addHexPrefix } from './utils/address';
import {
  sendAndAwaitAllSerial,
  signTransaction,
  sendSignedTransaction,
} from './txn';
import getSuggestedGasPrice from './getSuggestedGasPrice';
import { GAS_LIMITS } from './constants';
import { toBN } from 'web3-utils';
import { safeToWei } from './lib';
import { isPlanet } from './utils/point';

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
  fromWalletType,
  fromWalletHdPath,
  toWallet,
  point,
  web3,
  contracts,
  networkType,
  onUpdate,
  transferEth = false,
  nextRevision = INITIAL_NETWORK_KEY_REVISION,
  txnSigner,
  txnSender,
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
  if (!isPlanet(point)) {
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

  const gasPriceGwei = (
    await getSuggestedGasPrice(networkType)
  ).average.price.toFixed();
  const chainId = await web3.eth.net.getId();
  const gasPriceWeiBN = toBN(safeToWei(gasPriceGwei, 'gwei'));
  let inviteNonce = await web3.eth.getTransactionCount(fromWallet.address);
  const totalCost = txs.reduce(
    (acc, tx) => acc.add(gasPriceWeiBN.mul(toBN(tx.gas))),
    toBN(0)
  );

  let txPairs = [];

  // Must be done in serial else hardware will give nonce errors
  for (let i = 0; i < txs.length; i++) {
    const stx = await signTransaction({
      wallet: fromWallet,
      walletType: fromWalletType,
      walletHdPath: fromWalletHdPath,
      networkType,
      txn: txs[i],
      nonce: inviteNonce + i,
      chainId,
      gasPrice: gasPriceGwei,
      gasLimit: txs[i].gas,
      txnSigner,
      txnSender,
    });
    txPairs.push({
      raw: hexify(stx.serialize()),
      signed: stx,
    });
  }

  inviteNonce = inviteNonce + txs.length;

  //
  // ensuring funding for transactions
  //

  progress(TRANSACTION_PROGRESS.FUNDING);

  const usedTank = await tank.ensureFundsFor(
    web3,
    point,
    fromWallet.address,
    fromWalletType,
    totalCost,
    txPairs.map(p => p.raw),
    askForFunding,
    gotFunding
  );

  //
  // sending and awaiting transactions
  //

  progress(TRANSACTION_PROGRESS.TRANSFERRING);

  const receipts = await sendAndAwaitAllSerial(
    web3,
    txPairs.map(p => p.signed),
    usedTank
  );

  const realCost = gasPriceWeiBN.mul(
    receipts.reduce((sum, receipt) => {
      return sum.add(toBN(receipt.gasUsed));
    }, toBN(0))
  );

  //
  // move leftover eth
  //

  progress(TRANSACTION_PROGRESS.CLEANING);

  let balance = toBN(await web3.eth.getBalance(fromWallet.address));
  const gasLimit = GAS_LIMITS.SEND_ETH;
  const sendEthCost = gasPriceWeiBN.mul(toBN(gasLimit));

  // if we have funds left over from what the gas tank gave us, send those back
  if (usedTank && realCost.add(sendEthCost).lt(totalCost)) {
    try {
      const remainder = totalCost.sub(realCost).sub(sendEthCost);
      console.log('returning to gas tank', remainder.toString());
      const txn = { to: tank.TANK_ADDRESS, value: remainder };
      const stx = await signTransaction({
        wallet: fromWallet,
        walletType: fromWalletType,
        walletHdPath: fromWalletHdPath,
        txn,
        chainId,
        networkType,
        gasPrice: gasPriceGwei,
        gasLimit,
        nonce: inviteNonce,
      });
      sendSignedTransaction(web3, stx);

      // only update these after the above succeeded
      inviteNonce++;
      balance = balance.sub(remainder).sub(sendEthCost);
    } catch (err) {
      console.log('error returning gas, safely ignored:');
      console.log(err);
    }
  }

  // if non-trivial eth left in invite wallet, transfer to new ownership
  if (transferEth && balance.gt(sendEthCost)) {
    try {
      const value = balance.sub(sendEthCost);
      const txn = {
        to: toWallet.ownership.keys.address,
        value: value,
      };
      const stx = await signTransaction({
        wallet: fromWallet,
        walletType: fromWalletType,
        walletHdPath: fromWalletHdPath,
        txn,
        chainId,
        networkType,
        gasPrice: gasPriceGwei,
        gasLimit,
        nonce: inviteNonce,
      });
      sendSignedTransaction(web3, stx);
    } catch (err) {
      console.log('error sending value tx, safely ignored:');
      console.log(err);
    }
  }

  progress(TRANSACTION_PROGRESS.DONE);
}
