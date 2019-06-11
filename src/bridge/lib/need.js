// need.js: +need but worse
//
// generally, pass the props object into these functions

import { BRIDGE_ERROR } from '../lib/error'

function web3(obj) {
  return ('web3' in obj === false)
    ? (() => { throw BRIDGE_ERROR.MISSING_WEB3 })()
    : obj.web3.matchWith({
        Nothing: () => { throw BRIDGE_ERROR.MISSING_WEB3 },
        Just: w => w.value
      });
}

function contracts(obj) {
  return ('contracts' in obj === false)
    ? (() => { throw BRIDGE_ERROR.MISSING_CONTRACTS })()
    : obj.contracts.matchWith({
        Nothing: () => { throw BRIDGE_ERROR.MISSING_CONTRACTS },
        Just: c => c.value
      });
}

function wallet(obj) {
  return ('wallet' in obj === false)
    ? (() => { throw BRIDGE_ERROR.MISSING_WALLET })()
    : obj.wallet.matchWith({
        Nothing: () => { throw BRIDGE_ERROR.MISSING_WALLET },
        Just: w => w.value
      });
}

function address(obj) {
  return wallet(obj).address;
}

function pointCursor(obj) {
  return ('pointCursor' in obj === false)
    ? (() => { throw BRIDGE_ERROR.MISSING_POINT })()
    : obj.pointCursor.matchWith({
        Nothing: () => { throw BRIDGE_ERROR.MISSING_POINT },
        Just: p => p.value
      });
}

function fromPointCache(obj, point) {
  return ('pointCache' in obj === false)
    ? (() => { throw BRIDGE_ERROR.MISSING_POINT })()
    : point in obj.pointCache
      ? obj.pointCache[point]
      : (() => { throw BRIDGE_ERROR.MISSING_POINT })()
}

export {
  web3,
  contracts,
  wallet,
  address,
  pointCursor,
  fromPointCache
}