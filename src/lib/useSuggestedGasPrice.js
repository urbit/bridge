import { useState, useEffect } from 'react';
import { NETWORK_TYPES } from './network';
import { DEFAULT_GAS_PRICE_GWEI } from './constants';

async function getSuggestedGasPrice(networkType) {
  switch (networkType) {
    case NETWORK_TYPES.ROPSTEN:
      return 10;
    case NETWORK_TYPES.OFFLINE:
      return DEFAULT_GAS_PRICE_GWEI;
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
        return Math.min(json.fast / 10, 20); // to gwei
      } catch (e) {
        return DEFAULT_GAS_PRICE_GWEI;
      }
  }
}

function useSuggestedGasPrice(networkType) {
  const [gasPrice, _setGasPrice] = useState(DEFAULT_GAS_PRICE_GWEI);

  useEffect(() => {
    (async () => {
      _setGasPrice(await getSuggestedGasPrice(networkType));
    })();
  }, [networkType]);

  return { gasPrice };
}

export { getSuggestedGasPrice, useSuggestedGasPrice };
