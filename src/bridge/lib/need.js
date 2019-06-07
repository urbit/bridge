// need.js: +need but worse
//
// generally, pass the props object into these functions

import { BRIDGE_ERROR } from '../lib/error'

function needWeb3(obj) {
  return obj.web3.matchWith({
    Nothing: () => { throw BRIDGE_ERROR.MISSING_WEB3 },
    Just: w => w.value
  });
}

function needContracts(obj) {
  return obj.contracts.matchWith({
    Nothing: () => { throw BRIDGE_ERROR.MISSING_CONTRACTS },
    Just: c => c.value
  });
}

function needWallet(obj) {
  return obj.wallet.matchWith({
    Nothing: () => { throw BRIDGE_ERROR.MISSING_WALLET },
    Just: w => w.value
  });
}

function needAddress(obj) {
  return needWallet(obj).address;
}

function needPointCursor(obj) {
  return obj.pointCursor.matchWith({
    Nothing: () => { throw BRIDGE_ERROR.MISSING_POINT },
    Just: p => p.value
  });
}

function needFromPointCache(obj, point) {
  return point in obj.pointCache
         ? obj.pointCache[point]
         : (() => { throw BRIDGE_ERROR.MISSING_POINT })()
}

export {
  needWeb3,
  needContracts,
  needWallet,
  needAddress,
  needPointCursor,
  needFromPointCache
}