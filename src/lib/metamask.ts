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
export const metamaskSignTransaction = async (txn: FakeSignableTx) => {
  return FakeSignResult(txn, metamaskSendTransaction);
};

const metamaskSendTransaction = async (txn: FakeSignableTx, web3: Web3) => {
  const { data, gasLimit, gasPrice, nonce, to, from } = txn;
  if (!(data && gasLimit && gasPrice && nonce && to && from)) {
    throw new Error('Unable to send Metamask TX, something is missing');
  }

  // web3-eth/TransactionConfig type
  const metamaskFormattedTxn = {
    data: data.toString(),
    gasLimit,
    gasPrice,
    nonce: Number(nonce).toString(),
    to: to.toString(),
    from: toHex(from),
  };

  let txHash;
  if (window.ethereum) {
    //NOTE  see also #596, #630, #646
    //      no idea what's going on, we should figure it out,
    //      but we apply this bandaid to hopefully stop the bleeding.
    //      at least it also helps with the NOTE of the other branch.
    txHash = await window.ethereum.request({
      method: 'eth_sendTransaction',
      params: [metamaskFormattedTxn],
      from: txn.from,
    });
  } else {
    //NOTE  since this gives us a receipt instead of just the hash of the
    //      signed tx, it makes us wait for confirmation outside of our own
    //      waitForTransactionConfirm. because of this the progress bar loses
    //      its progressiveness for metamask users.

    // Per the web3 lib's Typescript declarations, sendTransaction
    // expects a Transaction nonce of type number to be passed in.
    // However, at runtime, Metamask throws an error indicating that 
    // nonce should be a string.
    //@ts-ignore
    let receipt = await web3.eth.sendTransaction(metamaskFormattedTxn);
    txHash = receipt.transactionHash;
  }
  return txHash;
};
