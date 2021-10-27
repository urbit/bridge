import Web3 from 'web3';
import { toHex } from 'web3-utils';
import { FakeSignableTx, FakeSignResult } from './txn';

export class MetamaskWallet {
  address: string;

  constructor(address: string) {
    this.address = address;
  }
}

// Cheat a bit and pretend to sign transaction
// Sign it actually when sending
export const metamaskSignTransaction = async (
  txn: FakeSignableTx,
  from: string
) => {
  txn.from = from;
  return FakeSignResult(txn, metamaskSendTransaction);
};

const metamaskSendTransaction = async (txn: FakeSignableTx, web3: Web3) => {
  const metamaskFormattedTxn = {
    data: txn.data,
    gasLimit: txn.gasLimit,
    gasPrice: txn.gasPrice,
    nonce: txn.nonce,
    to: toHex(txn.to),
    from: toHex(txn.from),
  };

  //NOTE  since this gives us a receipt instead of just the hash of the signed
  //      tx, it makes us wait for confirmation outside of our own
  //      waitForTransactionConfirm. because of this the progress bar loses
  //      its progressiveness for metamask users.
  //TODO  can we do better?
  const receipt = await web3.eth.sendTransaction(metamaskFormattedTxn);
  return receipt.transactionHash;
};
