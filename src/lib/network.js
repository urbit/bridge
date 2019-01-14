const NETWORK_NAMES = {
  OFFLINE: Symbol('OFFLINE'),
  LOCAL: Symbol('LOCAL'),
  ROPSTEN: Symbol('ROPSTEN'),
  MAINNET: Symbol('MAINNET'),
}

const renderNetworkType = (network) =>
    network === NETWORK_NAMES.OFFLINE
  ? 'Offline'
  : network === NETWORK_NAMES.ROPSTEN
  ? 'Ropsten'
  : network === NETWORK_NAMES.MAINNET
  ? 'Main Network'
  : network === NETWORK_NAMES.LOCAL
  ? 'Local Node'
  : 'Offline'

export {
  NETWORK_NAMES,
  renderNetworkType
}
