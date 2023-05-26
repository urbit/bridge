import { Common, Chain, Hardfork } from '@ethereumjs/common';
import {
  FeeMarketEIP1559Transaction as EIP1559Transaction,
  TxOptions,
  FeeMarketEIP1559TxData as EIP1559TxData,
} from '@ethereumjs/tx';
import { toHex, toWei } from 'web3-utils';
import retry from 'async-retry';
import { NETWORK_TYPES } from './network';
import { walletConnectSignTransaction } from './WalletConnect';
import { metamaskSignTransaction } from './metamask';
import { addHexPrefix } from './utils/address';
import {
  CHECK_BLOCK_EVERY_MS,
  EIP1559_TRANSACTION_TYPE,
  WALLET_TYPES,
} from './constants';
import Web3 from 'web3';
import { TransactionConfig, TransactionReceipt } from 'web3-core';
import BridgeWallet from './types/BridgeWallet';
import { GasPriceData } from 'components/L2/Dropdowns/FeeDropdown';
import { ITxData } from './types/ITxData';

const RETRY_OPTIONS = {
  retries: 99999,
  factor: 1,
  minTimeout: CHECK_BLOCK_EVERY_MS,
  randomize: false,
};

export type FakeSignableTx = EIP1559Transaction;

type TxSender = (txn: FakeSignableTx, web3: Web3) => Promise<string>;

export type FakeSignedTx = {
  txn: FakeSignableTx;
  send: TxSender;
  serialize: () => string;
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
  walletHdPath: string; // TODO: is this still needed?
  networkType: symbol;
  txn: { data: string; to: string; value: number };
  nonce: number | string;
  chainId: number | string;
  gasPriceData: GasPriceData;
  gasLimit: number;
  txnSigner?: (args: ITxData) => Promise<string>;
  txnSender?: (args: ITxData) => Promise<string>;
}

const _web3 = () => {
  const ENDPOINT = `https://mainnet.infura.io/v3/${
    import.meta.env.VITE_INFURA_ENDPOINT
  }`;
  return new Web3(new Web3.providers.HttpProvider(ENDPOINT));
};

const estimateGasLimit = async (utx: TransactionConfig) => {
  const web3 = _web3();
  const estimate = await web3.eth.estimateGas(utx);
  return web3.utils
    .toBN(estimate)
    .muln(120)
    .divn(100); // 20% cushion
};

const getMaxFeePerGas = async () => {
  const web3 = _web3();
  const fee = await web3.eth.getGasPrice();
  return (Number(fee) * 1.2).toFixed(0); // 20% cushion
};

const signTransaction = async ({
  wallet,
  walletType,
  walletHdPath, // TODO
  networkType,
  txn, // output of transactionBuilder in useEthereumTransaction
  nonce, // number
  chainId, // number
  gasPriceData, // GasPriceData
  gasLimit, // TODO: do we need the default values anymore? now that the estiamte is loaded dynamically
  txnSigner, // optionally inject a transaction signing function,
  txnSender, // and a sending function, for wallets that need these passed in.
}: signTransactionProps) => {
  const from = wallet.address;
  const estimate = await estimateGasLimit({ ...txn, from });
  const maxFeePerGas = await getMaxFeePerGas();

  const txParams: EIP1559TxData = {
    data: toHex(txn.data),
    to: toHex(txn.to),
    gasLimit: toHex(estimate),
    maxFeePerGas: toHex(maxFeePerGas),
    maxPriorityFeePerGas: toHex(
      toWei(Math.round(gasPriceData.maxPriorityFeePerGas).toFixed(0), 'gwei')
    ),
    nonce: toHex(nonce),
    chainId: toHex(chainId),
    type: toHex(EIP1559_TRANSACTION_TYPE),
  };

  const chain =
    networkType === NETWORK_TYPES.GOERLI ? Chain.Goerli : Chain.Mainnet;

  const txConfig: TxOptions = {
    freeze: false,
    common: new Common({
      chain,
      hardfork: Hardfork.Merge,
    }),
  };

  let stx = EIP1559Transaction.fromTxData(txParams, txConfig);

  if (walletType === WALLET_TYPES.METAMASK) {
    return metamaskSignTransaction(stx);
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
  stx: EIP1559Transaction | FakeSignedTx,
  doubtNonceError: boolean
): Promise<string> => {
  //  if we couldn't sign it, we depend on the given sender function
  if (!(stx instanceof EIP1559Transaction)) {
    // TODO
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
  stxs: EIP1559Transaction[] | FakeSignedTx[],
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
  stxs: EIP1559Transaction[] | FakeSignedTx[],
  doubtNonceError: boolean
) => {
  //@ts-expect-error tsc complains that stxs.reduce() is not callable
  return stxs.reduce(
    (
      promise: Promise<TransactionReceipt[]>,
      stx: EIP1559Transaction | FakeSignedTx
    ) =>
      promise.then(async (receipts = []) => {
        const txHash = await sendSignedTransaction(web3, stx, doubtNonceError);
        return [...receipts, await waitForTransactionConfirm(web3, txHash)];
      }),
    Promise.resolve()
  );
};

const sendTransactionsAndAwaitConfirm = async (
  web3: Web3,
  signedTxs: EIP1559Transaction[] | FakeSignedTx[],
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
