import { ITxData } from '@walletconnect/types';
import { JsonTx, Transaction, FeeMarketEIP1559Transaction as EIP1559Transaction } from '@ethereumjs/tx';
import { stripHexPrefix } from './utils/address';
import { FakeSignableTx, FakeSignResult } from './txn';
import Web3 from 'web3';
import { EIP1559_TRANSACTION_TYPE } from './constants';

type SignWalletConnectTransactionArgs = {
  from: string;
  txn: Transaction | EIP1559Transaction;
  txnSigner: (txn: ITxData) => Promise<string>;
  txnSender: (txn: ITxData) => Promise<string>;
};

const walletConnectSignTransaction = async ({
  from,
  txn,
  txnSigner,
  txnSender,
}: SignWalletConnectTransactionArgs) => {
  // tsc complains about missing from and gas, which are populated in subsequent lines
  //@ts-ignore
  let wcFormattedTx: JsonTx & {
    from: string;
    gas: string;
  } = txn.toJSON();
  wcFormattedTx.from = from;
  wcFormattedTx.type = `0x${EIP1559_TRANSACTION_TYPE}`;

  let signature;
  try {
    signature = await txnSigner(wcFormattedTx);
  } catch (e) {
    if (e.message === 'METHOD_NOT_SUPPORTED' || e.message === '"eth_signTransaction" not implemented') {
      console.log('connected wc wallet does not support tx signing.');
      return FakeSignResult(
        wcFormattedTx,
        //@ts-ignore // TODO
        walletConnectSendTransaction(txnSender)
      );
    } else {
      throw e;
    }
  }
  const serializedTx = Buffer.from(stripHexPrefix(signature), 'hex');
  const signedTx = EIP1559Transaction.fromSerializedTx(serializedTx);

  return signedTx;
};

const walletConnectSendTransaction = (
  txnSender: (tx: FakeSignableTx) => Promise<string>
) => (txn: FakeSignableTx, _web3: Web3): Promise<string> => txnSender(txn);

export { walletConnectSignTransaction };
