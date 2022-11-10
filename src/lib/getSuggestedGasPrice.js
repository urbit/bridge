import { NETWORK_TYPES } from './network';
import { DEFAULT_GAS_PRICE_GWEI, MAX_GAS_PRICE_GWEI } from './constants';
import { formatWait } from 'components/L2/Dropdowns/FeeDropdown';
import Web3 from 'web3';
import _ from 'lodash';
import {isGoerli} from './flags';

// ethgasstation returns values in floating point, one order of magitude
// more than gwei. see: https://docs.ethgasstation.info
// we don't want to charge users more than the gas tank funds
const minGas = gas => Math.min(Math.ceil(gas), MAX_GAS_PRICE_GWEI);

const feeToInt = (f) => f < 1 ? 1 : Math.round(f);

const feeToWei = (fee) => { if(_.isNaN(fee)) { debugger; } console.log(fee); return Web3.utils.toHex(Web3.utils.toWei(String(fee), 'gwei' )) };

const calculateMaxFee = (baseFee, maxPriorityFee) => feeToWei(Math.round((2 * baseFee) + maxPriorityFee))

export const defaultGasValues = value => ({
  fast: {
    price: value,
    wait: '1',
    maxFeePerGas: value,
    maxPriorityFeePerGas: 2,
    suggestedBaseFeePerGas: value > 2 ? value -1 : 1,
  },
  average: {
    price: value,
    wait: '1',
    maxFeePerGas: value,
    maxPriorityFeePerGas: 1,
    suggestedBaseFeePerGas: value > 2 ? value -1 : 1,
  },
  low: {
    price: value,
    wait: '1',
    maxFeePerGas: value,
    maxPriorityFeePerGas: 1,
    suggestedBaseFeePerGas: value > 2 ? value -1 : 1,
  },
});

const getGasForNetwork = async (providerUrl) => {
  try {
    if (INITIAL_NETWORK_TYPE === NETWORK_TYPES.GOERLI) {
      throw new Error('no goerli support');
    }
    const [etherscanGas, ethgasstationGas] = await Promise.all([
      fetch(
        `${providerUrl}/api` +
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

    console.log(etherscanGasJson, ethgasstationGasJson);

    const suggestedBaseFeePerGas = Number(etherscanGasJson.result.suggestBaseFee);

    // Calculations derived from:
    // https://www.blocknative.com/blog/eip-1559-fees
    const result = {
      fast: {
        price: minGas(etherscanGasJson.result.FastGasPrice),
        wait: formatWait(ethgasstationGasJson.fastWait),
        maxFeePerGas: calculateMaxFee(suggestedBaseFeePerGas, etherscanGasJson.result.FastGasPrice - suggestedBaseFeePerGas),
        maxPriorityFeePerGas: feeToInt((etherscanGasJson.result.FastGasPrice - suggestedBaseFeePerGas)),
        suggestedBaseFeePerGas
      },
      average: {
        price: minGas(etherscanGasJson.result.ProposeGasPrice),
        wait: formatWait(ethgasstationGasJson.avgWait),
        maxFeePerGas: calculateMaxFee(suggestedBaseFeePerGas, etherscanGasJson.result.ProposeGasPrice - suggestedBaseFeePerGas),
        maxPriorityFeePerGas: feeToInt((etherscanGasJson.result.ProposeGasPrice - suggestedBaseFeePerGas)),
        suggestedBaseFeePerGas
      },
      low: {
        price: minGas(etherscanGasJson.result.SafeGasPrice),
        wait: formatWait(ethgasstationGasJson.safeLowWait),
        maxFeePerGas: calculateMaxFee(suggestedBaseFeePerGas, etherscanGasJson.result.SafeGasPrice - suggestedBaseFeePerGas),
        maxPriorityFeePerGas: feeToInt((etherscanGasJson.result.SafeGasPrice - suggestedBaseFeePerGas)),
        suggestedBaseFeePerGas
      },
    };
    console.log(result);
    return result;
  } catch (e) {
    console.warn(e);
    return defaultGasValues(DEFAULT_GAS_PRICE_GWEI);
  }
}

export default async function getSuggestedGasPrice(networkType) {
  switch (networkType) {
    case NETWORK_TYPES.GOERLI:
      return getGasForNetwork('https://api-goerli.etherscan.io')
    case NETWORK_TYPES.OFFLINE:
      return defaultGasValues(DEFAULT_GAS_PRICE_GWEI);
    case NETWORK_TYPES.LOCAL:
    default:
      return getGasForNetwork('https://api.etherscan.io/');
  }
}
