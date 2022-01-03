import * as bip39 from 'bip39';
import * as bitcoin from 'bitcoinjs-lib';
import ob from 'urbit-ob';
import { includes } from 'lodash';

import { isValidAddress } from './utils/address';
import { patp2dec } from './patp2dec';
import { patpStringLength } from './lib';
import {
  ETH_ZERO_ADDR,
  ETH_ZERO_ADDR_SHORT,
  MIN_GALAXY,
  MAX_GALAXY,
} from './constants';

// NOTE: do not use the /g modifier for these regexes
// https://stackoverflow.com/a/21373261
// https://stackoverflow.com/a/1520853

// via: https://emailregex.com/
const emailRegExp = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

// validate only strings that use hex characters
const isHexString = /[0-9A-Fa-f]/;

// validate only strings that are prefixed with 0x
const isHexPrefixed = /^0x/;

// Validates a bip39 mnemonic
export const validateMnemonic = (v: string) =>
  !bip39.validateMnemonic(v) && 'This is not a valid mnemonic.';

const isHdPath = /^m(\/[0-9]+'?)*$/;
export const validateHdPath = (v: string) =>
  !isHdPath.test(v) && 'Invalid HD derivation path.';

// Checks an empty field
export const validateNotEmpty = (v?: Array<unknown> | string) =>
  (v === undefined || v.length === 0) && 'This field is required.';

// Checks if a patp is a valid galaxy
export const validateGalaxy = (v: string) => {
  try {
    const point = patp2dec(v);
    const isValidGalaxy = point >= MIN_GALAXY && point <= MAX_GALAXY;
    if (!isValidGalaxy) {
      throw new Error();
    }
  } catch {
    return 'This is not a valid galaxy.';
  }
};

export const validatePoint = (v: string) => {
  try {
    if (!ob.isValidPatp(v)) {
      throw new Error();
    }
  } catch {
    return 'This is not a valid point.';
  }
};

export const validatePatq = (v: string) => {
  try {
    if (!ob.isValidPatq(v)) {
      throw new Error();
    }
  } catch {
    return 'This is not a valid ticket.';
  }
};

export const validateActivationTicket = (v: string) => {
  try {
    if (v.length < 42) {
      throw new Error();
    }
  } catch {
    return 'This is not a valid activation ticket.';
  }
};

export const validateShard = (v: string) => {
  try {
    if (v !== undefined && v !== '' && !ob.isValidPatq(v)) {
      throw new Error();
    }
  } catch {
    return 'This is not a valid shard.';
  }
};

export const validateOneOf = (options: unknown[] = []) => (v: unknown) =>
  !includes(options, v) && 'Is not a valid option.';

export const validateHexString = (v: string) =>
  !isHexString.test(v) && 'This is not a valid hex string.';

export const validateHexPrefix = (v: string) =>
  !isHexPrefixed.test(v) && 'Must include 0x prefix.';

export const validateEthereumAddress = (v: string) =>
  !isValidAddress(v) && 'This is not a valid Ethereum address.';

export const validateEmail = (v: string) =>
  !emailRegExp.test(v) && 'This is not a valid email address.';

export function validateExactly<T>(value: T, error: string) {
  return (v: T) => v !== value && error;
}

export const validateNotAny = (values: unknown[] = []) => (v: unknown) =>
  values.includes(v) && `Cannot be ${v}.`;

type Lengthable = string | Array<unknown> | Buffer;

export const validateLength = (l: number) => (v: Lengthable) =>
  v.length !== l && `Must be exactly ${l} characters.`;

export const validateHexLength = (l: number) => (v: Lengthable) =>
  v.length !== l + 2 && `Must be exactly ${l} hex characters.`;

export const validateMaximumLength = (l: number) => (v: Lengthable) =>
  v.length > l && `Must be ${l} characters or fewer.`;

export const validateMinimumLength = (l: number) => (v: Lengthable) =>
  v.length < l && `Must be ${l} characters or more.`;

export const validateGreaterThan = (l: number) => (v: number) =>
  !(v > l) && `Must be greater than ${l}.`;

export const validateLessThan = (l: number) => (v: number) =>
  !(v < l) && `Must be less than ${l}`;

export const validateInSet = (set: Set<unknown>, error: string) => (
  v: unknown
) => !set.has(v) && error;

export const validateMaximumPatpByteLength = (byteLength: number) =>
  validateMaximumLength(patpStringLength(byteLength));

export const validateMinimumPatpByteLength = (byteLength: number) =>
  validateMinimumLength(patpStringLength(byteLength));

export const validateNotNullAddress = validateNotAny([
  ETH_ZERO_ADDR,
  ETH_ZERO_ADDR_SHORT,
]);

export const validateUnique = (arr: unknown[]) => {
  const res =
    [...Array.from(new Set(arr))].length !== arr.length && 'Must be unique';
  return res;
};

export const validateChild = (ourShip: string) => (ship: string) =>
  ourShip !== ob.sein(ship) && `This point is not a child of ${ourShip}.`;

export const validatePsbt = (base64: string) => {
  try {
    bitcoin.Psbt.fromBase64(base64);
  } catch (e) {
    return 'Invalid Partially Signed Bitcoin Transaction';
  }
};
