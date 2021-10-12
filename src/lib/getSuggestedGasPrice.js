import { NETWORK_TYPES } from './network';
import { DEFAULT_GAS_PRICE_GWEI, MAX_GAS_PRICE_GWEI } from './constants';
import { formatWait } from 'components/L2/Dropdowns/FeeDropdown';

// ethgasstation returns values in floating point, one order of magitude
// more than gwei. see: https://docs.ethgasstation.info
// we don't want to charge users more than the gas tank funds
const minGas = gas => Math.min(Math.ceil(gas / 10), MAX_GAS_PRICE_GWEI);

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
        const response = await fetch(
          'https://ethgasstation.info/json/ethgasAPI.json',
          {
            method: 'GET',
            cache: 'no-cache',
          }
        );

        const json = await response.json();

        return {
          fast: {
            price: minGas(json.fast),
            wait: formatWait(json.fastWait),
          },
          average: {
            price: minGas(json.average),
            wait: formatWait(json.avgWait),
          },
          low: {
            price: minGas(json.safeLow),
            wait: formatWait(json.safeLowWait),
          },
        };
      } catch (e) {
        return defaultGasValues(DEFAULT_GAS_PRICE_GWEI);
      }
  }
}
