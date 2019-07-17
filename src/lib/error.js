const BRIDGE_ERROR = {
  MISSING_WEB3: 'no web3 object found',
  MISSING_WALLET: 'no wallet found',
  MISSING_TXN: 'no transaction found',
  MISSING_CONTRACTS: 'no contracts found',
  MISSING_KEYSTORE: 'no keystore text found',
  MISSING_MNEMONIC: 'no authentication mnemonic found',
  MISSING_URBIT_WALLET: 'no urbit wallet found',
  MISSING_POINT: 'no point found',
  MISSING_AUTH_MNEMONIC: 'no mnemonic found',
  MISSING_POINT_DETAILS: 'no details of point found',
  INVALID_ROUTE: 'invalid route',
  INVALID_NETWORK_TYPE: 'invalid network type',
  INVALID_WALLET_TYPE: 'invalid wallet type',
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
