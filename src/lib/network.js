import { isMainnet } from "./flags";
import { ETHEREUM_GOERLI_CHAIN_ID, ETHEREUM_MAINNET_CHAIN_ID,  } from './constants';

const NETWORK_TYPES = {
  OFFLINE: Symbol('OFFLINE'),
  LOCAL: Symbol('LOCAL'),
  GOERLI: Symbol('GOERLI'),
  MAINNET: Symbol('MAINNET'),
};

const renderNetworkType = network =>
  network === NETWORK_TYPES.OFFLINE
    ? 'Offline'
    : network === NETWORK_TYPES.GOERLI
    ? 'Goerli'
    : network === NETWORK_TYPES.MAINNET
    ? 'Main Network'
    : network === NETWORK_TYPES.LOCAL
    ? 'Local Node'
    : 'Offline';

const chainIdToNetworkType = chainId => {
  switch (chainId) {
    case '0x1':
      return NETWORK_TYPES.MAINNET;
    case '0x5':
      return NETWORK_TYPES.GOERLI;
    default:
      return NETWORK_TYPES.LOCAL;
  }
};

const expectedChainId = () => {
  return isMainnet ? ETHEREUM_MAINNET_CHAIN_ID : ETHEREUM_GOERLI_CHAIN_ID;
}

export { NETWORK_TYPES, expectedChainId, renderNetworkType, chainIdToNetworkType };
