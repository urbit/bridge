import { ITxData } from '@walletconnect/types';
import Tx from 'ethereumjs-tx';
import { sanitizeHex } from './utils/address';

type SignWalletConnectTransactionArgs = {
  txn: Tx;
  from: string;
  txnSigner: (args: ITxData) => Promise<string>;
};

const walletConnectSignTransaction = async ({
  txn,
  from,
  txnSigner,
}: SignWalletConnectTransactionArgs) => {
  console.log(txn);

  // example from:
  // https://docs.walletconnect.org/quick-start/dapps/client#sign-transaction-eth_signtransaction
  // const formattedWCTx = {
  //   from: '0xbc28Ea04101F03aA7a94C1379bc3AB32E65e62d3', // Required
  //   to: '0x89D24A7b4cCB1b6fAA2625Fe562bDd9A23260359', // Required (for non contract deployments)
  //   data: '0x', // Required
  //   gasPrice: '0x02540be400', // Optional
  //   gas: '0x9c40', // Optional
  //   value: '0x00', // Optional
  //   nonce: '0x0114', // Optional
  // };

  const txnValue =
    txn.value.toString('hex') === '' ? '00' : txn.value.toString('hex');

  const formattedWCTx = {
    from: from,
    to: sanitizeHex(txn.to.toString('hex')),
    data: sanitizeHex(txn.data.toString('hex')),
    gasPrice: sanitizeHex(txn.gasPrice.toString('hex')),
    gas: sanitizeHex(txn.gasLimit.toString('hex')),
    value: sanitizeHex(txnValue),
    nonce: sanitizeHex(
      txn.nonce.length === 0 ? '00' : txn.nonce.toString('hex')
    ),
  };

  console.log(formattedWCTx);

  const sig = await txnSigner(formattedWCTx);

  console.log(sig);

  // TODO: update passed in txn with signed data
  // txn.v = Buffer.from(payload.v.slice(2), 'hex');
  // txn.r = Buffer.from(payload.r.slice(2), 'hex');
  // txn.s = Buffer.from(payload.s.slice(2), 'hex');

  return txn;
};

export { walletConnectSignTransaction };
