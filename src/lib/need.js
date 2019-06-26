// need.js: +need but worse
//

import { BRIDGE_ERROR } from './error';

const needBuilder = error => obj => {
  if (!obj) {
    throw error;
  }

  return obj.matchWith({
    Nothing: () => {
      throw error;
    },
    Just: p => p.value,
  });
};

export const web3 = needBuilder(BRIDGE_ERROR.MISSING_WEB3);
export const contracts = needBuilder(BRIDGE_ERROR.MISSING_CONTRACTS);
export const wallet = needBuilder(BRIDGE_ERROR.MISSING_WALLET);
export const addressFromWallet = obj => wallet(obj).address;
export const pointCursor = needBuilder(BRIDGE_ERROR.MISSING_POINT);
export const pointCache = needBuilder(BRIDGE_ERROR.MISSING_POINT);
export const fromPointCache = (cache, point) => {
  if (!(point in cache)) {
    throw BRIDGE_ERROR.MISSING_POINT;
  }

  return cache[point];
};
export const keystore = obj => {
  const ks = needBuilder(BRIDGE_ERROR.MISSING_KEYSTORE)();
  return ks.value.matchWith({
    Ok: result => result.value,
    Error: _ => {
      throw BRIDGE_ERROR.MISSING_KEYSTORE;
    },
  });
};
