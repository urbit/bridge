import { useNetwork } from 'store/network';
import { NETWORK_TYPES } from './network';

function useEtherscanDomain() {
  const { networkType } = useNetwork();

  switch (networkType) {
    case NETWORK_TYPES.GOERLI:
      return 'https://goerli.etherscan.io';
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
export function useExploreTxUrls(txHashes = []) {
  const domain = useEtherscanDomain();

  return txHashes.map(txHash => `${domain}/tx/${txHash}`);
}

export function useExploreAddressUrl(address) {
  const domain = useEtherscanDomain();

  return `${domain}/address/${address}`;
}
