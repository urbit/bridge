import { NETWORK_TYPES } from './network';
import { DEFAULT_GAS_PRICE_GWEI } from './constants';

export default async function getSuggestedGasPrice(networkType) {
  switch (networkType) {
    case NETWORK_TYPES.ROPSTEN:
      return 10;
    case NETWORK_TYPES.OFFLINE:
      return DEFAULT_GAS_PRICE_GWEI;
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

        // ethgasstation returns values in floating point, one order of magitude
        // more than gwei. see: https://docs.ethgasstation.info
        const suggestedGasPrice = Math.ceil(json.fast / 10); // to gwei

        // we don't want to charge users more than our default 20 gwei
        return Math.min(suggestedGasPrice, DEFAULT_GAS_PRICE_GWEI);
      } catch (e) {
        return DEFAULT_GAS_PRICE_GWEI;
      }
  }
}
