import { NETWORK_TYPES } from './network';
import { DEFAULT_GAS_PRICE_GWEI, MAX_GAS_PRICE_GWEI } from './constants';
import Web3 from 'web3';

// ethgasstation returns values in floating point, one order of magitude
// more than gwei. see: https://docs.ethgasstation.info
// we don't want to charge users more than the gas tank funds
const minGas = gas => Math.min(gas, MAX_GAS_PRICE_GWEI);

const feeToWei = fee => Web3.utils.toHex(Web3.utils.toWei(String(fee), 'gwei'));

// Gwei with milligwei precision, rounded up so we never underpay
const roundGwei = gwei => Math.ceil(gwei * 1000) / 1000;

const weiToGwei = wei => roundGwei(wei / 1_000_000_000);

const calculateMaxFee = (baseFee, maxPriorityFee) =>
  feeToWei(Math.round(2 * baseFee + maxPriorityFee));

// Convert seconds to minutes prettily
const formatWait = wait => Math.round((wait * 100) / 60) / 100;

export const defaultGasValues = value => ({
  fast: {
    price: value,
    wait: '1',
    maxFeePerGas: value,
    maxPriorityFeePerGas: Math.min(1, value),
    suggestedBaseFeePerGas: value > 2 ? value - 1 : 1,
  },
  average: {
    price: value,
    wait: '1',
    maxFeePerGas: value,
    maxPriorityFeePerGas: Math.min(1, value),
    suggestedBaseFeePerGas: value > 2 ? value - 1 : 1,
  },
  low: {
    price: value,
    wait: '1',
    maxFeePerGas: value,
    maxPriorityFeePerGas: Math.min(1, value),
    suggestedBaseFeePerGas: value > 2 ? value - 1 : 1,
  },
});

const median = values => {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

// Number of recent blocks to sample, and the priority fee percentiles
// used for the low, average and fast tiers respectively
const FEE_HISTORY_BLOCKS = 20;
const REWARD_PERCENTILES = [10, 50, 90];
// Floor for the priority fee, since zero tip transactions may never be mined
const MIN_PRIORITY_FEE_GWEI = 0.001;

const tierFor = (baseFeeGwei, priorityFeeWei, wait) => {
  const maxPriorityFeePerGas = Math.max(
    weiToGwei(priorityFeeWei),
    MIN_PRIORITY_FEE_GWEI
  );
  const maxFeePerGas = roundGwei(baseFeeGwei + maxPriorityFeePerGas);
  return {
    price: minGas(maxFeePerGas),
    wait: formatWait(wait),
    maxFeePerGas,
    maxPriorityFeePerGas,
    suggestedBaseFeePerGas: baseFeeGwei,
  };
};

// Estimates fees from the connected node via eth_feeHistory, in the same
// manner as wallets do. See: https://docs.alchemy.com/docs/how-to-build-a-gas-fee-estimator-using-eip-1559
const getGasForNetwork = async web3 => {
  try {
    const history = await web3.eth.getFeeHistory(
      FEE_HISTORY_BLOCKS,
      'latest',
      REWARD_PERCENTILES
    );

    // baseFeePerGas includes one extra entry: the base fee of the next block
    const nextBaseFeeWei = Number(history.baseFeePerGas.at(-1));
    const baseFeeGwei = nextBaseFeeWei / 1_000_000_000;

    const [low, average, fast] = REWARD_PERCENTILES.map((_, i) =>
      median(history.reward.map(rewards => Number(rewards[i])))
    );

    return {
      fast: tierFor(baseFeeGwei, fast, 15),
      average: tierFor(baseFeeGwei, average, 60),
      low: tierFor(baseFeeGwei, low, 180),
    };
  } catch (e) {
    console.warn(e);
    return defaultGasValues(DEFAULT_GAS_PRICE_GWEI);
  }
};

export default async function getSuggestedGasPrice(networkType, web3) {
  if (networkType === NETWORK_TYPES.OFFLINE || !web3) {
    return defaultGasValues(DEFAULT_GAS_PRICE_GWEI);
  }

  return getGasForNetwork(web3);
}
