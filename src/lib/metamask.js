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
  const metamaskFormattedTxn = {
    to: txn.to.toString('hex'),
    value: txn.value.toString('hex'),
    data: txn.data.toString('hex'),
    gasLimit: txn.gasLimit.toString('hex'),
    gasPrice: txn.gasPrice.toString('hex'),
    nonce: txn.nonce.length === 0 ? '00' : txn.nonce.toString('hex'),
    from: from,
  };

  return new FakeMetamaskTransaction(metamaskFormattedTxn);
};
