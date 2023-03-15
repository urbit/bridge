import { FeeMarketEIP1559Transaction as EIP1559Transaction, JsonTx } from '@ethereumjs/tx';
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
export const metamaskSignTransaction = async (txn: EIP1559Transaction) => {
  return FakeSignResult(txn, metamaskSendTransaction);
};

const metamaskSendTransaction = async (txn: FakeSignableTx, web3: Web3) => {
  /**
   * Depending which version of Metamask is installed, there are different 
   * approaches to get the `from` address.
   */
  let from = null;
  if (window.ethereum) {
    from = window.ethereum.selectedAddress;
    if (!from) {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      from = accounts[0] ?? null;
    }
  } else if (window.web3) {
    from = window.web3?.eth?.defaultAccount ?? null;
  } else {
    const accounts = await web3.eth.getAccounts();
    from = accounts[0] ?? null;
  }

  if (!from) {
    throw new Error('No accounts connected');
  }

  const { data, to, value, maxPriorityFeePerGas, maxFeePerGas } = txn.toJSON();
  if (!(data && to && value && maxPriorityFeePerGas && maxFeePerGas && from)) {
    throw new Error('Unable to send Metamask TX, something is missing');
  }

  // https://docs.metamask.io/guide/sending-transactions.html#transaction-parameters
  // https://github.com/brave/brave-wallet-docs/blob/b19d8884035b00fb21b7ea7628199fea17d5c6ee/docs/ethereum/use-cases/sending-transactions.md
  const metamaskFormattedTxn = {
    from,
    to,
    value,
    data,
    maxPriorityFeePerGas,
    maxFeePerGas
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
    });
  } else {
    //NOTE  since this gives us a receipt instead of just the hash of the
    //      signed tx, it makes us wait for confirmation outside of our own
    //      waitForTransactionConfirm. because of this the progress bar loses
    //      its progressiveness for metamask users.
    let receipt = await web3.eth.sendTransaction(metamaskFormattedTxn);
    txHash = receipt.transactionHash;
  }
  return txHash;
};
