import { NETWORK_TYPES } from './network';
import { DEFAULT_GAS_PRICE_GWEI, MAX_GAS_PRICE_GWEI } from './constants';
import Web3 from 'web3';

// ethgasstation returns values in floating point, one order of magitude
// more than gwei. see: https://docs.ethgasstation.info
// we don't want to charge users more than the gas tank funds
const minGas = gas => Math.min(Math.ceil(gas), MAX_GAS_PRICE_GWEI);

const feeToInt = f => (f < 1 ? 1 : Math.round(f));

const feeToWei = fee => Web3.utils.toHex(Web3.utils.toWei(String(fee), 'gwei'));

const weiToGwei = wei => Math.ceil(wei / 1_000_000_000);

const calculateMaxFee = (baseFee, maxPriorityFee) =>
  feeToWei(Math.round(2 * baseFee + maxPriorityFee));

// Convert seconds to minutes prettily
const formatWait = wait => Math.round((wait * 100) / 60) / 100;

export const defaultGasValues = value => ({
  fast: {
    price: value,
    wait: '1',
    maxFeePerGas: value,
    maxPriorityFeePerGas: 1,
    suggestedBaseFeePerGas: value > 2 ? value - 1 : 1,
  },
  average: {
    price: value,
    wait: '1',
    maxFeePerGas: value,
    maxPriorityFeePerGas: 1,
    suggestedBaseFeePerGas: value > 2 ? value - 1 : 1,
  },
  low: {
    price: value,
    wait: '1',
    maxFeePerGas: value,
    maxPriorityFeePerGas: 1,
    suggestedBaseFeePerGas: value > 2 ? value - 1 : 1,
  },
});

const getGasForNetwork = async providerUrl => {
  try {
    const feeResponse = await fetch(
      providerUrl,
      {
        method: 'get',
        cache: 'no-cache',
      }
    );
    const feeJson = await feeResponse.json();

    // Calculations derived from:
    // https://www.blocknative.com/blog/eip-1559-fees
    return {
      fast: {
        price: minGas(weiToGwei(feeJson.data.rapid)),
        wait: formatWait(15),
        maxFeePerGas: weiToGwei(feeJson.data.rapid)
      },
      average: {
        price: minGas(weiToGwei(feeJson.data.fast)),
        wait: formatWait(60),
        maxFeePerGas: weiToGwei(feeJson.data.fast)
      },
      low: {
        price: minGas(weiToGwei(feeJson.data.standard)),
        wait: formatWait(180),
        maxFeePerGas: weiToGwei(feeJson.data.standard)
      },
    };
  } catch (e) {
    console.warn(e);
    return defaultGasValues(DEFAULT_GAS_PRICE_GWEI);
  }
};

export default async function getSuggestedGasPrice(networkType) {
  switch (networkType) {
    case NETWORK_TYPES.GOERLI:
      return getGasForNetwork('https://beaconcha.in/api/v1/execution/gasnow');
    case NETWORK_TYPES.OFFLINE:
      return defaultGasValues(DEFAULT_GAS_PRICE_GWEI);
    case NETWORK_TYPES.LOCAL:
    default:
      return getGasForNetwork('https://beaconcha.in/api/v1/execution/gasnow');
  }
}
