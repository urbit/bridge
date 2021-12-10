import { NETWORK_TYPES } from './network';
import { DEFAULT_GAS_PRICE_GWEI, MAX_GAS_PRICE_GWEI } from './constants';
import { formatWait } from 'components/L2/Dropdowns/FeeDropdown';

// ethgasstation returns values in floating point, one order of magitude
// more than gwei. see: https://docs.ethgasstation.info
// we don't want to charge users more than the gas tank funds
const minGas = gas => Math.min(Math.ceil(gas), MAX_GAS_PRICE_GWEI);

export const defaultGasValues = value => ({
  fast: {
    price: value,
    wait: '1',
  },
  average: {
    price: value,
    wait: '1',
  },
  low: {
    price: value,
    wait: '1',
  },
});

export default async function getSuggestedGasPrice(networkType) {
  switch (networkType) {
    case NETWORK_TYPES.ROPSTEN:
      return defaultGasValues(10);
    case NETWORK_TYPES.OFFLINE:
      return defaultGasValues(DEFAULT_GAS_PRICE_GWEI);
    case NETWORK_TYPES.LOCAL:
    default:
      try {
        const etherscanGas = await fetch(
          'https://api.etherscan.io/api' +
            '?module=gastracker' +
            '&action=gasoracle' +
            '&apikey=CG52E4R96W56GIKUI4IJ8CH9EZIXPUW1W8',
          {
            method: 'GET',
            cache: 'no-cache',
          }
        );

        const ethgasstationGas = await fetch(
          'https://ethgasstation.info/json/ethgasAPI.json',
          {
            method: 'GET',
            cache: 'no-cache',
          }
        );

        const etherscanGasJson = await etherscanGas.json();

        const ethgasstationGasJson = await ethgasstationGas.json();

        return {
          fast: {
            price: minGas(etherscanGasJson.result.FastGasPrice),
            wait: formatWait(ethgasstationGasJson.fastWait),
          },
          average: {
            price: minGas(etherscanGasJson.result.ProposeGasPrice),
            wait: formatWait(ethgasstationGasJson.avgWait),
          },
          low: {
            price: minGas(etherscanGasJson.result.SafeGasPrice),
            wait: formatWait(ethgasstationGasJson.safeLowWait),
          },
        };
      } catch (e) {
        return defaultGasValues(DEFAULT_GAS_PRICE_GWEI);
      }
  }
}
