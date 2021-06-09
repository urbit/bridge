import BN from 'bn.js';
import { Just, Nothing } from 'folktale/maybe';

import * as noun from '../nockjs/noun';
import * as serial from '../nockjs/serial';
import * as kg from 'urbit-key-generation';

import { addHexPrefix, eqAddr } from './utils/address';
import { shas } from './networkCode';

// the curve param for the network keys
export const NETWORK_KEY_CURVE_PARAMETER = '42';
// the current crypto suite version
export const CRYPTO_SUITE_VERSION = 1;

export const CURVE_ZERO_ADDR =
  '0x0000000000000000000000000000000000000000000000000000000000000000';

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

// simple alias to avoid importing kg into component scope
export const deriveNetworkKeys = seed => kg.deriveNetworkKeys(seed);

export const createRing = pair =>
  pair.crypt.private + pair.auth.private + NETWORK_KEY_CURVE_PARAMETER;

/**
 * @param {object} pair
 * @param {number} point
 * @param {number} revision
 * @return {string}
 */
export const compileNetworkKey = (pair, point, revision) => {
  const bnsec = new BN(createRing(pair), 'hex');

  const sed = noun.dwim(
    noun.Atom.fromInt(point),
    noun.Atom.fromInt(revision),
    noun.Atom.fromString(bnsec.toString()),
    noun.Atom.fromInt(0)
  );

  return b64(jam(sed));
};

/**
 * @param {number} point
 * @param {array<{revision: number, pair: object}>} keys
 * @return {string}
 */
export const compileMultiKey = (point, keys) => {
  const kyz = keys.map(k => {
    const bnsec = new BN(createRing(k.pair), 'hex');
    return noun.dwim(
      noun.Atom.fromInt(k.revision),
      noun.Atom.fromString(bnsec.toString())
    );
  });
  kyz.push(noun.Atom.fromInt(0));

  const fed = noun.dwim(
    noun.dwim(noun.Atom.fromInt(1), noun.Atom.fromInt(0)), // version
    noun.Atom.fromInt(point), // ship
    noun.dwim(kyz) // keys
  );

  return b64(jam(fed));
};

/**
 * @param {object} urbitWallet
 * @param {number} revision
 * @return {Promise<Maybe<string>>}
 */
export const deriveNetworkSeedFromUrbitWallet = async (
  urbitWallet,
  revision = 1
) => {
  return await deriveNetworkSeedFromMnemonic(
    urbitWallet.management.seed,
    urbitWallet.meta.passphrase,
    revision
  );
};

/**
 * @param {Maybe<any>} wallet
 * @param {string} authMnemonic
 * @param {object} details
 * @param {number} revision
 * @return {Promise<Maybe<string>>}
 */
export const deriveNetworkSeedFromManagementMnemonic = async (
  wallet,
  authMnemonic,
  details,
  revision = 1
) => {
  const isManagementProxy = eqAddr(wallet.address, details.managementProxy);

  // the network seed is derivable iff this mnemonic is the management proxy
  if (isManagementProxy) {
    return await deriveNetworkSeedFromMnemonic(
      authMnemonic,
      wallet.passphrase,
      revision
    );
  }

  return Nothing();
};

/**
 * @param {string} mnemonic
 * @param {string} passphrase
 * @param {number} revision
 * @return {Promise<Maybe<string>>}
 */
const deriveNetworkSeedFromMnemonic = async (
  mnemonic,
  passphrase,
  revision
) => {
  //NOTE revision is the point's on-chain revision number. since common uhdw
  //     usage derives the first key at revision/index 0, we need to decrement
  //     the on-chain revision number by one to get the number to derive with.
  return Just(await kg.deriveNetworkSeed(mnemonic, passphrase, revision - 1));
};

/**
 * @param {number} point
 * @param {string} authToken
 * @param {number} revision
 * @return {Maybe<string>}
 */
export const deriveNetworkSeedFromAuthToken = (point, authToken, revision) => {
  //NOTE revision is the point's on-chain revision number.
  //     since deriveNetworkSeedFromMnemonic does this too, we decrement the
  //     revision number by one before deriving from it.
  const salt = Buffer.from(`revision-${point}-${revision - 1}`);
  const networkSeed = shas(authToken, salt)
    .toString('hex')
    .slice(0, 32);
  return Just(networkSeed);
};

/**
 * Derives from either a full Urbit Wallet, a current management mnemonic,
 * or an auth token, in that order of preference.
 * @return {Promise<Maybe<string>>}
 */
export const attemptNetworkSeedDerivation = async ({
  urbitWallet,
  wallet,
  authMnemonic,
  details,
  point,
  authToken,
  revision,
}) => {
  if (Just.hasInstance(urbitWallet)) {
    return await deriveNetworkSeedFromUrbitWallet(urbitWallet.value, revision);
  }

  if (Just.hasInstance(wallet) && Just.hasInstance(authMnemonic)) {
    const managementSeed = await deriveNetworkSeedFromManagementMnemonic(
      wallet.value,
      authMnemonic.value,
      details,
      revision
    );
    if (Just.hasInstance(managementSeed)) {
      return managementSeed;
    }
  }

  if (Just.hasInstance(authToken)) {
    return deriveNetworkSeedFromAuthToken(point, authToken.value, revision);
  }

  return Nothing();
};

/**
 *
 * @param {object} pair - type NetworkKeys
 * @param {object} details - type L1Point
 * @return {boolean}
 */
export const keysMatchChain = (pair, details) => {
  const { crypt, auth } = pair;
  const { encryptionKey, authenticationKey } = details;

  return (
    encryptionKey === addHexPrefix(crypt.public) &&
    authenticationKey === addHexPrefix(auth.public)
  );
};

export const segmentNetworkKey = hex => {
  if (hex === CURVE_ZERO_ADDR) {
    return null;
  }

  const sl = i => hex.slice(i, i + 4);
  const rowFrom = i => `${sl(i)}.${sl(i + 4)}.${sl(i + 8)}.${sl(i + 12)}`;

  return [rowFrom(2), rowFrom(18), rowFrom(34), rowFrom(50)];
};

// ctsy @yosoyubik
/**
 * @param {object} pair
 * @param {number} point
 * @param {number} revision
 * @return {string}
 */
export const compileMultikey = (point, pair1, pair2, revision1, revision2) => {
  const bnsec1 = new BN(createRing(pair1), 'hex');
  const bnsec2 = new BN(createRing(pair2), 'hex');

  const tag = noun.dwim(noun.Atom.fromInt(1), noun.Atom.yes);
  const ship = noun.Atom.fromInt(point);
  const key1 = noun.dwim(
    noun.Atom.fromInt(revision1),
    noun.Atom.fromString(bnsec1.toString())
  );
  const key2 = noun.dwim(
    noun.Atom.fromInt(revision2),
    noun.Atom.fromString(bnsec2.toString())
  );

  const sed = noun.dwim(tag, ship, key1, key2, noun.Atom.yes);

  return b64(jam(sed));
};
