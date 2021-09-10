import { NETWORK_TYPES } from './network';
import { DEFAULT_GAS_PRICE_GWEI, MAX_GAS_PRICE_GWEI } from './constants';

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
          'https://api.etherscan.io/api' +
            '?module=gastracker' +
            '&action=gasoracle' +
            '&apikey=CG52E4R96W56GIKUI4IJ8CH9EZIXPUW1W8',
          {
            method: 'GET',
            cache: 'no-cache',
          }
        );

        const json = await response.json();

        if (json && json.status !== '1') {
          console.warn('suggested gas price warning', json.message);
        }

        const suggestedGasPrice = parseInt(
          json && json.result && json.result.ProposeGasPrice
        );
        if (isNaN(suggestedGasPrice)) {
          throw new Error('strange gas price response', json);
        }

        // safeguard against obscene suggestions
        return Math.min(suggestedGasPrice, MAX_GAS_PRICE_GWEI);
      } catch (e) {
        console.warn('error fetching gas price', e);
        return DEFAULT_GAS_PRICE_GWEI;
      }
  }
}
