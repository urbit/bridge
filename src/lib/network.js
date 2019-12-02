const NETWORK_TYPES = {
  OFFLINE: Symbol('OFFLINE'),
  LOCAL: Symbol('LOCAL'),
  ROPSTEN: Symbol('ROPSTEN'),
  MAINNET: Symbol('MAINNET'),
};

const renderNetworkType = network =>
  network === NETWORK_TYPES.OFFLINE
    ? 'Offline'
    : network === NETWORK_TYPES.ROPSTEN
    ? 'Ropsten'
    : network === NETWORK_TYPES.MAINNET
    ? 'Main Network'
    : network === NETWORK_TYPES.LOCAL
    ? 'Local Node'
    : 'Offline';

export { NETWORK_TYPES, renderNetworkType };
