import { NETWORK_TYPES } from './network';
import { DEFAULT_GAS_PRICE_GWEI, MAX_GAS_PRICE_GWEI } from './constants';
import Web3 from 'web3';

// ethgasstation returns values in floating point, one order of magitude
// more than gwei. see: https://docs.ethgasstation.info
// we don't want to charge users more than the gas tank funds
const minGas = gas => Math.min(Math.ceil(gas), MAX_GAS_PRICE_GWEI);

const feeToInt = (f) => f < 1 ? 1 : Math.round(f);

const feeToWei = (fee) => Web3.utils.toHex(Web3.utils.toWei(String(fee), 'gwei' ))

const calculateMaxFee = (baseFee, maxPriorityFee) => feeToWei(Math.round((2 * baseFee) + maxPriorityFee))

// Convert seconds to minutes prettily
const formatWait = (wait) => Math.round((wait * 100) / 60) / 100;

export const defaultGasValues = value => ({
  fast: {
    price: value,
    wait: '1',
    maxFeePerGas: value,
    maxPriorityFeePerGas: 1,
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
    const [feeResponse, waitResponse] = await Promise.all([
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
        'https://ethereum-api.xyz/gas-prices',
        {
          method: 'GET',
          cache: 'no-cache',
        }
      )
    ]);

    const [feeJson, waitJson] = await Promise.all([
      feeResponse.json(),
      waitResponse.json()
    ])

    const suggestedBaseFeePerGas = Number(feeJson.result.suggestBaseFee);

    // Calculations derived from:
    // https://www.blocknative.com/blog/eip-1559-fees
    return {
      fast: {
        price: minGas(feeJson.result.FastGasPrice),
        wait: formatWait(waitJson.result.fast.time),
        maxFeePerGas: calculateMaxFee(suggestedBaseFeePerGas, feeJson.result.FastGasPrice - suggestedBaseFeePerGas),
        maxPriorityFeePerGas: feeToInt((feeJson.result.FastGasPrice - suggestedBaseFeePerGas)),
        suggestedBaseFeePerGas
      },
      average: {
        price: minGas(feeJson.result.ProposeGasPrice),
        wait: formatWait(waitJson.result.average.time),
        maxFeePerGas: calculateMaxFee(suggestedBaseFeePerGas, feeJson.result.ProposeGasPrice - suggestedBaseFeePerGas),
        maxPriorityFeePerGas: feeToInt((feeJson.result.ProposeGasPrice - suggestedBaseFeePerGas)),
        suggestedBaseFeePerGas
      },
      low: {
        price: minGas(feeJson.result.SafeGasPrice),
        wait: formatWait(waitJson.result.slow.time),
        maxFeePerGas: calculateMaxFee(suggestedBaseFeePerGas, feeJson.result.SafeGasPrice - suggestedBaseFeePerGas),
        maxPriorityFeePerGas: feeToInt((feeJson.result.SafeGasPrice - suggestedBaseFeePerGas)),
        suggestedBaseFeePerGas
      },
    };
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
