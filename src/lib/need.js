// need.js: +need but worse
//

import { BRIDGE_ERROR } from './error';

const needBuilder = fn => obj => {
  if (!obj) {
    fn();
  }

  return obj.matchWith({
    Nothing: fn,
    Just: p => p.value,
  });
};

// simpler function for inline need.value(thing, () => {})
export const value = (obj, fn) => needBuilder(fn)(obj);

export const details = needBuilder(() => {
  throw new Error(BRIDGE_ERROR.MISSING_POINT_DETAILS);
});

export const web3 = needBuilder(() => {
  throw new Error(BRIDGE_ERROR.MISSING_WEB3);
});

export const contracts = needBuilder(() => {
  throw new Error(BRIDGE_ERROR.MISSING_CONTRACTS);
});

export const wallet = needBuilder(() => {
  throw new Error(BRIDGE_ERROR.MISSING_WALLET);
});

export const addressFromWallet = obj => wallet(obj).address;

export const point = needBuilder(() => {
  throw new Error(BRIDGE_ERROR.MISSING_POINT);
});

export const pointCache = needBuilder(() => {
  throw new Error(BRIDGE_ERROR.MISSING_POINT);
});

export const fromPointCache = (cache, point) => {
  if (!(point in cache)) {
    throw new Error(BRIDGE_ERROR.MISSING_POINT);
  }

  return cache[point];
};

export const keystore = obj => {
  const ks = needBuilder(BRIDGE_ERROR.MISSING_KEYSTORE)(obj);
  return ks.value.matchWith({
    Ok: result => result.value,
    Error: _ => {
      throw new Error(BRIDGE_ERROR.MISSING_KEYSTORE);
    },
  });
};
