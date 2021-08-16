import { ITxData } from '@walletconnect/types';
import { Transaction } from '@ethereumjs/tx';
import { stripHexPrefix } from './utils/address';

type SignWalletConnectTransactionArgs = {
  from: string;
  txn: Transaction;
  txnSigner: (args: ITxData) => Promise<string>;
};

const walletConnectSignTransaction = async ({
  from,
  txn,
  txnSigner,
}: SignWalletConnectTransactionArgs) => {
  let wcFormattedTx = txn.toJSON();
  wcFormattedTx.from = from;
  wcFormattedTx.gas = wcFormattedTx.gasLimit;

  const signature = await txnSigner(wcFormattedTx);
  const serializedTx = Buffer.from(stripHexPrefix(signature), 'hex');
  const signedTx = Transaction.fromSerializedTx(serializedTx);

  return signedTx;
};

export { walletConnectSignTransaction };
