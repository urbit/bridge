import Common, { Chain, Hardfork } from '@ethereumjs/common';
import { JsonTx, Transaction } from '@ethereumjs/tx';
import { ITxData } from '@walletconnect/types';
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
import Web3 from 'web3';
import { TransactionReceipt } from 'web3-core';
import BridgeWallet from './types/BridgeWallet';

const RETRY_OPTIONS = {
  retries: 99999,
  factor: 1,
  minTimeout: CHECK_BLOCK_EVERY_MS,
  randomize: false,
};

type SignableTx = Transaction & {
  nonce: string;
  chainId: string;
  gasPrice: string;
  gasLimit: string;
  from: string;
};

// catch-all type: Metamask passes an obj shaped like ITxData, WC passes JsonTx + from
export type FakeSignableTx =
  | ITxData
  | (JsonTx & { from: string; to: string; gas: string })
  | SignableTx;

type TxSender = (txn: FakeSignableTx, web3: Web3) => Promise<string>; // Metamask requires Web3 (txhash)

type SignedTx = {
  serialize: () => string;
};

export type FakeSignedTx = SignedTx & {
  txn: FakeSignableTx;
  send: TxSender;
};

const FakeSignResult = (txn: FakeSignableTx, send: TxSender): FakeSignedTx => {
  return {
    txn,
    serialize: () => {
      return '???'; //NOTE  update tank.js when changing this!
    },
    send,
  };
};

interface signTransactionProps {
  wallet: BridgeWallet;
  walletType: symbol;
  walletHdPath: string;
  networkType: symbol;
  txn: Transaction;
  nonce: number | string;
  chainId: number | string;
  gasPrice: string;
  gasLimit: string;
  txnSigner?: (args: ITxData) => Promise<string>;
  txnSender?: (args: ITxData) => Promise<string>;
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
  txnSigner, // optionally inject a transaction signing function,
  txnSender, // and a sending function, for wallets that need these passed in.
}: signTransactionProps) => {
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

  const utx: SignableTx = Object.assign(txn, signingParams);

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

  let stx: Transaction | FakeSignedTx = Transaction.fromTxData(utx, txConfig);

  //TODO should try-catch and display error message to user,
  //     ie ledger's "pls enable contract data"
  //     needs to maybe happen at call-site though
  if (walletType === WALLET_TYPES.LEDGER) {
    await ledgerSignTransaction(stx, walletHdPath);
  } else if (walletType === WALLET_TYPES.TREZOR) {
    await trezorSignTransaction(stx, walletHdPath);
  } else if (walletType === WALLET_TYPES.METAMASK) {
    return metamaskSignTransaction(utx);
  } else if (walletType === WALLET_TYPES.WALLET_CONNECT) {
    if (!(txnSender && txnSigner)) {
      throw Error('WalletConnect TX signer unavailable');
    }

    stx = await walletConnectSignTransaction({
      from,
      txn: stx,
      txnSigner,
      txnSender,
    });
  } else {
    // BridgeWallet case
    stx = stx.sign(wallet.privateKey!);
  }

  return stx;
};

const sendSignedTransaction = (
  web3: Web3,
  stx: Transaction | FakeSignedTx,
  doubtNonceError: boolean
): Promise<string> => {
  //  if we couldn't sign it, we depend on the given sender function
  if (!(stx instanceof Transaction)) {
    if (doubtNonceError) {
      console.log('why doubting nonce error? tank unavailable without rawtx.');
    }
    if (!stx.send) {
      throw new Error('no sign+sending function available');
    }
    return stx.send(stx.txn, web3);
  }

  let rawTx: string = hexify(stx.serialize());
  let eventEmitter = web3.eth.sendSignedTransaction(rawTx);
  return new Promise(async (resolve, reject) => {
    eventEmitter
      .on('transactionHash', (hash: string) => {
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
const waitForTransactionConfirm = (web3: Web3, txHash: string) => {
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
const sendAndAwaitAll = (
  web3: Web3,
  stxs: Transaction[] | FakeSignedTx[],
  doubtNonceError: boolean
) => {
  return Promise.all(
    stxs.map(async tx => {
      const txHash = await sendSignedTransaction(web3, tx, doubtNonceError);
      return await waitForTransactionConfirm(web3, txHash);
    })
  );
};

const sendAndAwaitAllSerial = (
  web3: Web3,
  stxs: Array<Transaction> | Array<FakeSignedTx>,
  doubtNonceError: boolean
) => {
  // tsc complains that stxs.reduce() is not callable
  //@ts-ignore
  return stxs.reduce(
    (promise: Promise<TransactionReceipt[]>, stx: Transaction | FakeSignedTx) =>
      promise.then(async (receipts = []) => {
        const txHash = await sendSignedTransaction(web3, stx, doubtNonceError);
        return [...receipts, await waitForTransactionConfirm(web3, txHash)];
      }),
    Promise.resolve()
  );
};

const sendTransactionsAndAwaitConfirm = async (
  web3: Web3,
  signedTxs: Array<Transaction> | Array<FakeSignedTx>,
  usedTank: boolean
) =>
  Promise.all(signedTxs.map(tx => sendSignedTransaction(web3, tx, usedTank)));

const hexify = (val: string | Buffer) => addHexPrefix(val.toString('hex'));

export {
  RETRY_OPTIONS,
  FakeSignResult,
  signTransaction,
  sendSignedTransaction,
  waitForTransactionConfirm,
  sendTransactionsAndAwaitConfirm,
  sendAndAwaitAll,
  sendAndAwaitAllSerial,
  hexify,
};
