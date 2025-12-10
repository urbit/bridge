import { NETWORK_TYPES } from './network';
import { DEFAULT_GAS_PRICE_GWEI, MAX_GAS_PRICE_GWEI } from './constants';
import Web3 from 'web3';

// ethgasstation returns values in floating point, one order of magnitude
// more than gwei. see: https://docs.ethgasstation.info
// we don't want to charge users more than the gas tank funds
const minGas = gas => Math.min(Math.ceil(gas), MAX_GAS_PRICE_GWEI);

const feeToInt = f => (f < 1 ? 1 : Math.round(f));

const feeToWei = fee => Web3.utils.toHex(Web3.utils.toWei(String(fee), 'gwei'));

const weiToGwei = wei => {
  if (wei == null) return DEFAULT_GAS_PRICE_GWEI;
  const asBigInt = BigInt(wei.toString());
  const gwei = (asBigInt + 999_999_999n) / 1_000_000_000n; // ceil division
  return Number(gwei);
};

const calculateMaxFee = (baseFeeGwei, maxPriorityFeeGwei) =>
  feeToInt(2 * baseFeeGwei + maxPriorityFeeGwei);

const formatWait = wait => Math.round((wait * 100) / 60) / 100;

export const defaultGasValues = value => {
  const base = value > 2 ? value - 1 : 1;
  return {
    fast: {
      price: value,
      wait: '1',
      maxFeePerGas: value,
      maxPriorityFeePerGas: 1,
      suggestedBaseFeePerGas: base,
    },
    average: {
      price: value,
      wait: '1',
      maxFeePerGas: value,
      maxPriorityFeePerGas: 1,
      suggestedBaseFeePerGas: base,
    },
    low: {
      price: value,
      wait: '1',
      maxFeePerGas: value,
      maxPriorityFeePerGas: 1,
      suggestedBaseFeePerGas: base,
    },
  };
};

const getGasForNetwork = async providerUrl => {
  try {
    const [feeResponse, baseFeeResponse] = await Promise.all([
      fetch('https://beaconcha.in/api/v1/execution/gasnow', {
        method: 'GET',
        cache: 'no-cache',
      }),
      fetch(
        `${providerUrl}/v2/api` +
          '?module=gastracker' +
          '&action=gasoracle' +
          '&apikey=CG52E4R96W56GIKUI4IJ8CH9EZIXPUW1W8' +
          '&chainid=1',
        {
          method: 'GET',
          cache: 'no-cache',
        }
      ),
    ]);

    const [feeJson, baseFeeJson] = await Promise.all([
      feeResponse.json(),
      baseFeeResponse.json(),
    ]);

    const gasData = feeJson && feeJson.data ? feeJson.data : {};
    const resultObj = baseFeeJson && baseFeeJson.result ? baseFeeJson.result : {};

    let suggestedBaseFeePerGas = Number(resultObj.suggestBaseFee);
    if (!Number.isFinite(suggestedBaseFeePerGas) || suggestedBaseFeePerGas <= 0) {
      suggestedBaseFeePerGas = DEFAULT_GAS_PRICE_GWEI;
    }

    const rapidGwei = weiToGwei(gasData.rapid);
    const fastGwei = weiToGwei(gasData.fast);
    const slowGwei = weiToGwei(gasData.slow);

    const rapidPriority = Math.max(
      1,
      feeToInt(rapidGwei - suggestedBaseFeePerGas)
    );
    const fastPriority = Math.max(
      1,
      feeToInt(fastGwei - suggestedBaseFeePerGas)
    );
    const slowPriority = Math.max(
      1,
      feeToInt(slowGwei - suggestedBaseFeePerGas)
    );

    const rapidMaxFee = minGas(calculateMaxFee(suggestedBaseFeePerGas, rapidPriority));
    const fastMaxFee = minGas(calculateMaxFee(suggestedBaseFeePerGas, fastPriority));
    const slowMaxFee = minGas(calculateMaxFee(suggestedBaseFeePerGas, slowPriority));

    return {
      fast: {
        price: minGas(rapidGwei),
        wait: formatWait(15),
        maxFeePerGas: rapidMaxFee,
        maxPriorityFeePerGas: rapidPriority,
        suggestedBaseFeePerGas,
      },
      average: {
        price: minGas(fastGwei),
        wait: formatWait(60),
        maxFeePerGas: fastMaxFee,
        maxPriorityFeePerGas: fastPriority,
        suggestedBaseFeePerGas,
      },
      low: {
        price: minGas(slowGwei),
        wait: formatWait(180),
        maxFeePerGas: slowMaxFee,
        maxPriorityFeePerGas: slowPriority,
        suggestedBaseFeePerGas,
      },
    };
  } catch (e) {
    console.warn('getGasForNetwork fallback to defaults:', e);
    return defaultGasValues(DEFAULT_GAS_PRICE_GWEI);
  }
};

export default async function getSuggestedGasPrice(networkType) {
  switch (networkType) {
    case NETWORK_TYPES.GOERLI:
      return getGasForNetwork('https://api-goerli.etherscan.io');
    case NETWORK_TYPES.OFFLINE:
      return defaultGasValues(DEFAULT_GAS_PRICE_GWEI);
    case NETWORK_TYPES.LOCAL:
    default:
      return getGasForNetwork('https://api.etherscan.io');
  }
}
