import BN from 'bn.js';
import Maybe from 'folktale/maybe';
import * as need from './need';

import * as noun from '../nockjs/noun';
import * as serial from '../nockjs/serial';
import * as kg from 'urbit-key-generation/dist';

import { BRIDGE_ERROR } from './error';
import { WALLET_TYPES, eqAddr } from './wallet';

// ctsy joemfb
const b64 = buf => {
  let hex = buf.reverse().toString('hex');
  let n = new BN(hex, 'hex');
  let c = [];
  while (1 === n.cmpn(0)) {
    c.push(n.andln(0x3f));
    n = n.shrn(6);
  }

  // prettier-ignore
  const trans = j =>
    10 > j
    ? j + 48
    : 36 > j
    ? j + 87
    : 62 > j
    ? j + 29
    : 62 === j
    ? 45
    : 126;

  return (
    '0w' +
    c.reduce(
      (a, b, i) =>
        String.fromCharCode(trans(b)) + (i && 0 === i % 5 ? '.' : '') + a,
      ''
    )
  );
};

const jam = seed => {
  const hex = serial
    .jam(seed)
    .toString()
    .slice(2);
  const pad = hex.length % 2 === 0 ? hex : '0' + hex;
  return Buffer.from(pad, 'hex').reverse();
};

const genKey = (networkSeed, point, revision) => {
  const pair = kg.deriveNetworkKeys(networkSeed);
  const bnsec = new BN(pair.crypt.private + pair.auth.private + '42', 'hex'); // '42' is curve parameter

  const sed = noun.dwim(
    noun.Atom.fromInt(point),
    noun.Atom.fromInt(revision),
    noun.Atom.fromString(bnsec.toString()),
    noun.Atom.yes
  );

  return b64(jam(sed));
};

// 'next' refers to setting the next set of keys
// if false, we use revision - 1
const attemptNetworkSeedDerivation = async (next, args) => {
  const { walletType, urbitWallet, authMnemonic } = args;

  // NB (jtobin):
  //
  // following code is intentionally verbose for sake of clarity

  const point = need.pointCursor(args);
  const pointDetails = need.fromPointCache(args, point);

  const revision =
    next === true
      ? parseInt(pointDetails.keyRevisionNumber)
      : parseInt(pointDetails.keyRevisionNumber) - 1;

  let managementSeed = '';

  const ticketLike = [WALLET_TYPES.TICKET, WALLET_TYPES.SHARDS];

  if (ticketLike.includes(walletType)) {
    const uwal = urbitWallet.matchWith({
      Just: uw => uw.value,
      Nothing: _ => {
        throw BRIDGE_ERROR.MISSING_URBIT_WALLET;
      },
    });

    managementSeed = uwal.management.seed;
  } else if (walletType === WALLET_TYPES.MNEMONIC) {
    const walProxy = need.address(args);

    const mnemonic = authMnemonic.matchWith({
      Just: mnem => mnem.value,
      Nothing: _ => {
        throw BRIDGE_ERROR.MISSING_MNEMONIC;
      },
    });

    const chainProxy = pointDetails.managementProxy;

    // the network seed is only derivable from mnemonic if the derived
    // management seed equals the record we have on chain
    const networkSeedDerivable = eqAddr(walProxy, chainProxy);

    if (networkSeedDerivable === true) {
      managementSeed = mnemonic;
    }
  }

  if (managementSeed !== '') {
    const seed = await kg.deriveNetworkSeed(managementSeed, '', revision);

    if (seed === '') {
      return Maybe.Nothing();
    }

    return Maybe.Just(seed);
  }

  return Maybe.Nothing();
};

export { genKey, attemptNetworkSeedDerivation };
