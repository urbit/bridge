import Common, { Chain, Hardfork } from '@ethereumjs/common';
import { Transaction } from '@ethereumjs/tx';
import { toHex } from 'web3-utils';
import { safeFromWei, safeToWei } from './lib';
import retry from 'async-retry';

import { NETWORK_TYPES } from './network';
import { ledgerSignTransaction } from './ledger';
import { trezorSignTransaction } from './trezor';
import { walletConnectSignTransaction } from './WalletConnect';
import { metamaskSignTransaction } from './metamask';
import { addHexPrefix } from './utils/address';
import { CHECK_BLOCK_EVERY_MS, WALLET_TYPES } from './constants';
import { patp2dec } from './patp2dec';

const RETRY_OPTIONS = {
  retries: 99999,
  factor: 1,
  minTimeout: CHECK_BLOCK_EVERY_MS,
  randomize: false,
};

//NOTE  send of format (web3, txn) => web3-style event emitter
//TODO  should we pass .send explicit txhash/error callbacks instead?
function FakeSignResult(txn, send) {
  this.txn = txn;
  this.serialize = function() {
    return '[tbd]'; //TODO 'will be signed later' ?
  }
  this.send = send;
}

const signTransaction = async ({
  wallet,
  walletType,
  walletHdPath,
  networkType,
  txn,
  nonce, // number
  chainId, // number
  gasPrice, // string, in gwei
  gasLimit, // string | number
  txnSigner, // optionally inject a transaction signing function, for wc
  txnSender, // ^^                              sending
}) => {
  // TODO: require these in txn object
  nonce = toHex(nonce);
  chainId = toHex(chainId);
  gasPrice = toHex(safeToWei(gasPrice, 'gwei'));
  gasLimit = toHex(gasLimit);
  const from = wallet.address;

  const txParams = { nonce, chainId, gasPrice, gasLimit, from };

  // NB (jtobin)
  //
  // Ledger does not seem to handle EIP-155 automatically.  When using a Ledger,
  // if the block number is at least FORK_BLKNUM = 2675000, one needs to
  // pre-set the ECDSA signature parameters with r = 0, s = 0, and v = chainId
  // prior to signing.
  //
  // The easiest way to handle this is to just branch on the network, since
  // mainnet and Ropsten have obviously passed FORK_BLKNUM.  This is somewhat
  // awkward when dealing with offline transactions, since we might want to
  // test them on a local network as well.
  //
  // The best thing to do is probably to add an 'advanced' tab to offline
  // transaction generation where one can disable the defaulted-on EIP-155
  // settings in this case.  This is pretty low-priority, but is a
  // comprehensive solution.
  //
  // See:
  //
  // See https://github.com/LedgerHQ/ledgerjs/issues/43#issuecomment-366984725
  //
  // https://github.com/ethereum/EIPs/blob/master/EIPS/eip-155.md

  const eip155Params = {
    r: '0x00',
    s: '0x00',
    v: chainId,
  };

  const defaultEip155Networks = [
    NETWORK_TYPES.MAINNET,
    NETWORK_TYPES.ROPSTEN,
    NETWORK_TYPES.OFFLINE,
  ];

  const needEip155Params =
    walletType === WALLET_TYPES.LEDGER &&
    defaultEip155Networks.includes(networkType);

  const signingParams = needEip155Params
    ? Object.assign(txParams, eip155Params)
    : txParams;

  const utx = Object.assign(txn, signingParams);

  const txConfig: any = { freeze: false };
  //  we must specify the chain *either* in the Common object,
  //  *or* eip155 style, but never both!
  //
  if (!needEip155Params) {
    const chain =
      networkType === NETWORK_TYPES.ROPSTEN ? Chain.Ropsten : Chain.Mainnet;
    txConfig.common = new Common({
      chain: chain,
      hardfork: Hardfork.MuirGlacier,
    });
  }

  let stx = Transaction.fromTxData(utx, txConfig);

  //TODO should try-catch and display error message to user,
  //     ie ledger's "pls enable contract data"
  //     needs to maybe happen at call-site though
  if (walletType === WALLET_TYPES.LEDGER) {
    await ledgerSignTransaction(stx, walletHdPath);
  } else if (walletType === WALLET_TYPES.TREZOR) {
    await trezorSignTransaction(stx, walletHdPath);
  } else if (walletType === WALLET_TYPES.METAMASK) {
    return metamaskSignTransaction(utx, wallet.address);
  } else if (walletType === WALLET_TYPES.WALLET_CONNECT) {
    stx = await walletConnectSignTransaction({
      from,
      txn: stx,
      txnSigner,
      txnSender,
    });
  } else {
    stx = stx.sign(wallet.privateKey);
  }

  return stx;
};

const sendSignedTransaction = (web3, stx, doubtNonceError) => {
  let eventEmitter;
  let rawTx;
  //  if we couldn't sign it, we depend on the sender function
  if (stx instanceof FakeSignResult) {
    eventEmitter = stx.send(web3, stx.txn);
  } else {
    rawTx = hexify(stx.serialize());
    eventEmitter = web3.eth.sendSignedTransaction(rawTx);
  }
  //TODO  consider working with Promise<txhash> instead of event
  //      emitter, considering we only use the hash & error cases.
  return new Promise(async (resolve, reject) => {
    eventEmitter
      .on('transactionHash', hash => {
        resolve(hash);
      })
      .on('error', err => {
        // if there's a nonce error, but we used the gas tank, it's likely
        // that it's because the tank already submitted our transaction.
        // we just wait for first confirmation here.
        const message = typeof err === 'string' ? err : err.message || '';
        const isKnownError =
          message.includes('known transaction') ||
          message.includes('already known');
        const isNonceError =
          message.includes("the tx doesn't have the correct nonce.") ||
          message.includes('nonce too low');
        if (rawTx && (isKnownError || (doubtNonceError && isNonceError))) {
          console.log(
            'tx send error likely from gas tank submission, ignoring:',
            message
          );
          const txHash = web3.utils.keccak256(rawTx);
          resolve(txHash);
        } else {
          console.error(err);
          const wrappedErr = err instanceof Error ? err : new Error(message);
          reject(wrappedErr);
        }
      });
  });
};

// returns a Promise<void>, throwing on tx failure
const waitForTransactionConfirm = (web3, txHash) => {
  return retry(async (bail, n) => {
    const receipt = await web3.eth.getTransactionReceipt(txHash);
    const confirmed = receipt !== null;
    if (!confirmed) {
      throw new Error('Transaction not confirmed.');
    }

    const success = receipt.status === true;
    if (!success) {
      return bail(new Error('Transaction failed.'));
    }
    return receipt;
  }, RETRY_OPTIONS);
};

// returns a Promise that resolves when all stxs have been sent & confirmed
const sendAndAwaitAll = (web3, stxs, doubtNonceError) => {
  return Promise.all(
    stxs.map(async tx => {
      const txHash = await sendSignedTransaction(web3, tx, doubtNonceError);
      return await waitForTransactionConfirm(web3, txHash);
    })
  );
};

const sendAndAwaitAllSerial = (web3, stxs, doubtNonceError) => {
  return stxs.reduce(
    (promise, stx) =>
      promise.then(async (receipts = []) => {
        const txHash = await sendSignedTransaction(web3, stx, doubtNonceError);
        return [...receipts, await waitForTransactionConfirm(web3, txHash)];
      }),
    Promise.resolve()
  );
};

const sendTransactionsAndAwaitConfirm = async (web3, signedTxs, usedTank) =>
  Promise.all(signedTxs.map(tx => sendSignedTransaction(web3, tx, usedTank)));

const hexify = val => addHexPrefix(val.toString('hex'));

const renderSignedTx = stx => ({
  messageHash: hexify(stx.hash()),
  v: hexify(stx.v),
  s: hexify(stx.s),
  r: hexify(stx.r),
  rawTransaction: hexify(stx.serialize()),
});

const getTxnInfo = async (web3, addr) => {
  let nonce = await web3.eth.getTransactionCount(addr);
  let chainId = await web3.eth.net.getId();
  let gasPrice = await web3.eth.getGasPrice();

  return {
    nonce: nonce,
    chainId: chainId,
    gasPrice: safeFromWei(gasPrice, 'gwei'),
  };
};

// TODO(shrugs): deprecate, unifiy with other callsites
const canDecodePatp = p => {
  try {
    patp2dec(p);
    return true;
  } catch (_) {
    return false;
  }
};

export {
  RETRY_OPTIONS,
  FakeSignResult,
  signTransaction,
  sendSignedTransaction,
  waitForTransactionConfirm,
  sendTransactionsAndAwaitConfirm,
  sendAndAwaitAll,
  sendAndAwaitAllSerial,
  getTxnInfo,
  hexify,
  renderSignedTx,
  canDecodePatp,
};
