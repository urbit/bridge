const BRIDGE_ERROR = {
  MISSING_WEB3: new Error('no web3 object found'),
  MISSING_WALLET: new Error('no wallet found'),
  MISSING_TXN: new Error('no transaction found'),
  MISSING_CONTRACTS: new Error('no contracts found'),
  MISSING_KEYSTORE: new Error('no keystore text found'),
  MISSING_MNEMONIC: new Error('no authentication mnemonic found'),
  MISSING_URBIT_WALLET: new Error('no urbit wallet found'),
  MISSING_POINT: new Error('no point found'),
  INVALID_ROUTE: new Error('invalid route'),
  INVALID_NETWORK_TYPE: new Error('invalid network type'),
  INVALID_WALLET_TYPE: new Error('invalid wallet type'),
};

const renderTxnError = (web3, msg) => {
  const txnCost = (web3, msg) => {
    const costWei = msg.match(/upfront cost is: ([0-9]+)/);
    const costEth = web3.utils.fromWei(costWei[1], 'ether');
    return parseFloat(costEth).toFixed(4);
  };

  const acctBalance = (web3, msg) => {
    const balWei = msg.match(/sender's account only has: ([0-9]+)/);
    const balEth = web3.utils.fromWei(balWei[1], 'ether');
    return parseFloat(balEth).toFixed(4);
  };

  return msg.includes("doesn't have enough funds")
    ? "The account doesn't have enough Ether. " +
        `The up-front transaction cost is ${txnCost(web3, msg)} ETH, but the ` +
        `account only holds ${acctBalance(web3, msg)} ETH.`
    : 'You may want to verify that the account that has signed the ' +
        'transaction holds sufficient Ether to pay for the gas, and ' +
        "also that you haven't set the gas limit for the transaction " +
        'too low.';
};

export { BRIDGE_ERROR, renderTxnError };
