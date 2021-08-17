import { ITxData } from '@walletconnect/types';
import { Transaction } from '@ethereumjs/tx';
import { stripHexPrefix } from './utils/address';
import { FakeSignResult } from './txn';

type SignWalletConnectTransactionArgs = {
  from: string;
  txn: Transaction;
  txnSigner: (args: ITxData) => Promise<string>;
  txnSender: (args: ITxData) => Promise<string>;
};

const walletConnectSignTransaction = async ({
  from,
  txn,
  txnSigner,
  txnSender
}: SignWalletConnectTransactionArgs) => {
  let wcFormattedTx = txn.toJSON();
  wcFormattedTx.from = from;
  wcFormattedTx.gas = wcFormattedTx.gasLimit;

  let signature;
  try {
    signature = await txnSigner(wcFormattedTx);
  } catch (e) {
    if (e.message === 'METHOD_NOT_SUPPORTED') {
      console.log('connected wc wallet does not support tx signing.');
      return new FakeSignResult(
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

const walletConnectSendTransaction = txnSender => (web3, txn) => {
  //TODO wrap in event emitter
  //TODO or should others just become Promise<txhash> as well?
  return txnSender(txn);
}

export { walletConnectSignTransaction };
