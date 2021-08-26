import { ITxData } from '@walletconnect/types';
import { Transaction } from '@ethereumjs/tx';
import { stripHexPrefix } from './utils/address';
import { FakeSignableTx, FakeSignResult } from './txn';
import Web3 from 'web3';

type SignWalletConnectTransactionArgs = {
  from: string;
  txn: Transaction;
  txnSigner: (txn: ITxData) => Promise<string>;
  txnSender: (txn: FakeSignableTx) => Promise<string>;
};

const walletConnectSignTransaction = async ({
  from,
  txn,
  txnSigner,
  txnSender,
}: SignWalletConnectTransactionArgs) => {
  // TS compiler complains next line about missing from and gas, which we set on the following lines
  let wcFormattedTx: FakeSignableTx = txn.toJSON();
  wcFormattedTx.from = from;
  wcFormattedTx.gas = wcFormattedTx.gasLimit;

  let signature;
  try {
    signature = await txnSigner(wcFormattedTx);
  } catch (e) {
    if (e.message === 'METHOD_NOT_SUPPORTED') {
      console.log('connected wc wallet does not support tx signing.');
      return FakeSignResult(
        wcFormattedTx,
        walletConnectSendTransaction(txnSender)
      );
    } else {
      throw e;
    }
  }
  const serializedTx = Buffer.from(stripHexPrefix(signature), 'hex');
  const signedTx = Transaction.fromSerializedTx(serializedTx);

  return signedTx;
};

const walletConnectSendTransaction = (
  txnSender: (tx: FakeSignableTx) => Promise<string>
) => (txn: FakeSignableTx, _web3: Web3): Promise<string> => txnSender(txn);

export { walletConnectSignTransaction };
