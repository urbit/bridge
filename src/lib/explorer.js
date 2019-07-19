import { useNetwork } from 'store/network';
import { NETWORK_TYPES } from './network';

function useEtherscanDomain() {
  const { networkType } = useNetwork();

  switch (networkType) {
    case NETWORK_TYPES.ROPSTEN:
      return 'https://ropsten.etherscan.io';
    case NETWORK_TYPES.OFFLINE:
    case NETWORK_TYPES.MAINNET:
    case NETWORK_TYPES.LOCAL:
    default:
      return 'https://etherscan.io';
  }
}

export function useExploreTxUrl(txHash) {
  const domain = useEtherscanDomain();

  return `${domain}/tx/${txHash}`;
}

export function useExploreAddressUrl(address) {
  const domain = useEtherscanDomain();

  return `${domain}/address/${address}`;
}
