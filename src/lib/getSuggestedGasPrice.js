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
        const [etherscanGas, ethgasstationGas] = await Promise.all([
          fetch(
            'https://api.etherscan.io/api' +
              '?module=gastracker' +
              '&action=gasoracle' +
              '&apikey=CG52E4R96W56GIKUI4IJ8CH9EZIXPUW1W8',
            {
              method: 'GET',
              cache: 'no-cache',
            }
          ),
          fetch(
            'https://ethgasstation.info/json/ethgasAPI.json',
            {
              method: 'GET',
              cache: 'no-cache',
            }
          )
        ]);

        const [etherscanGasJson, ethgasstationGasJson] = await Promise.all([
          etherscanGas.json(),
          ethgasstationGas.json()
        ])

        const suggestedBaseFeePerGas = Number(etherscanGasJson.result.suggestBaseFee);

        // Calculations inspired by:
        // https://github.com/liquality/chainify/blob/6e8243e8daf4dc219dcfd7df144ead3ff6183b26/packages/evm/lib/fee/EIP1559FeeApiProvider/ethereum.ts#L5
        return {
          fast: {
            price: minGas(etherscanGasJson.result.FastGasPrice),
            wait: formatWait(ethgasstationGasJson.fastWait),
            maxFeePerGas: minGas(etherscanGasJson.result.FastGasPrice),
            maxPriorityFeePerGas: (etherscanGasJson.result.FastGasPrice - suggestedBaseFeePerGas),
            suggestedBaseFeePerGas
          },
          average: {
            price: minGas(etherscanGasJson.result.ProposeGasPrice),
            wait: formatWait(ethgasstationGasJson.avgWait),
            maxFeePerGas: minGas(etherscanGasJson.result.ProposeGasPrice),
            maxPriorityFeePerGas: (etherscanGasJson.result.ProposeGasPrice - suggestedBaseFeePerGas),
            suggestedBaseFeePerGas
          },
          low: {
            price: minGas(etherscanGasJson.result.SafeGasPrice),
            wait: formatWait(ethgasstationGasJson.safeLowWait),
            maxFeePerGas: minGas(etherscanGasJson.result.SafeGasPrice),
            maxPriorityFeePerGas: (etherscanGasJson.result.SafeGasPrice - suggestedBaseFeePerGas),
            suggestedBaseFeePerGas
          },
        };
      } catch (e) {
        console.warn(e);
        return defaultGasValues(DEFAULT_GAS_PRICE_GWEI);
      }
  }
}
