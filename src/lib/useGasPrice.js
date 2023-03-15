import { useCallback, useEffect, useState } from 'react';

import { useNetwork } from 'store/network';

import getSuggestedGasPrices, {
  defaultGasValues,
} from 'lib/getSuggestedGasPrice';
import { DEFAULT_GAS_PRICE_GWEI } from './constants';

/**
 * handles all of the state of components that manage gas prices
 * + simple get/set
 * + lazy fetching optimal gas from oracle
 * + resetting to oracle (or sync) default
 * @param {Number} initialGasPrice the initial gas price available instantly
 */
export default function useGasPrice(initialGasPrice = DEFAULT_GAS_PRICE_GWEI) {
  const [mounted, setMounted] = useState(false);
  const { networkType } = useNetwork();
  const [suggestedGasPrices, setSuggestedGasPrices] = useState(
    defaultGasValues(initialGasPrice)
  ); // fast, average, low. In gwei
  const [gasPrice, setGasPrice] = useState(defaultGasValues(initialGasPrice).average); // GasPriceData

  const fetchPrices = useCallback(async () => {
    if (!mounted) {
      return;
    }

    const suggestedGasPrices = await getSuggestedGasPrices(networkType);
    console.log(suggestedGasPrices);

    // TODO: BN
    setSuggestedGasPrices(suggestedGasPrices);
    setGasPrice(suggestedGasPrices.average);
  }, [mounted]);

  useEffect(() => {
    setMounted(true);
    fetchPrices();
    return () => (setMounted(false));
  }, [mounted, networkType]);

  const resetGasPrice = useCallback(
    () => setGasPrice(suggestedGasPrices.average),
    [suggestedGasPrices]
  );

  return {
    suggestedGasPrices,
    gasPrice,
    setGasPrice,
    resetGasPrice,
  };
}
