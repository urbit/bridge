import { toHex } from 'web3-utils';
import { FakeSignResult } from './txn';

export function MetamaskWallet(address) {
  this.address = address;
}

export function FakeMetamaskTransaction(txnData) {
  this.txnData = txnData;

  this.serialize = function() {
    return '0';
  };
}

// Cheat a bit and pretend to sign transaction
// Sign it actually when sending
export const metamaskSignTransaction = async (txn, from) => {
  txn.from = from;
  return new FakeSignResult(txn, metamaskSendTransaction);
};

const metamaskSendTransaction = (web3, txn) => {
  const metamaskFormattedTxn = {
    data: txn.data,
    gasLimit: txn.gasLimit,
    gasPrice: txn.gasPrice,
    nonce: txn.nonce,
    to: toHex(txn.to),
    from: toHex(txn.from),
  };
  return web3.eth.sendTransaction(metamaskFormattedTxn);
}
