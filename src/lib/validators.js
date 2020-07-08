import * as bip39 from 'bip39';
import ob from 'urbit-ob';
import { includes } from 'lodash';

import { isValidAddress, ETH_ZERO_ADDR, ETH_ZERO_ADDR_SHORT } from './wallet';
import patp2dec from './patp2dec';
import { patpStringLength } from './lib';
import { MIN_GALAXY, MAX_GALAXY } from './constants';

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
export const validateMnemonic = v =>
  !bip39.validateMnemonic(v) && 'This is not a valid mnemonic.';

const isHdPath = /^m(\/[0-9]+'?)*$/;
export const validateHdPath = v =>
  !isHdPath.test(v) && 'Invalid HD derivation path.';

// Checks an empty field
export const validateNotEmpty = v =>
  (v === undefined || v.length === 0) && 'This field is required.';

// Checks if a patp is a valid galaxy
export const validateGalaxy = v => {
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

export const validatePoint = v => {
  try {
    if (!ob.isValidPatp(v)) {
      throw new Error();
    }
  } catch {
    return 'This is not a valid point.';
  }
};

export const validatePatq = v => {
  try {
    if (!ob.isValidPatq(v)) {
      throw new Error();
    }
  } catch {
    return 'This is not a valid ticket.';
  }
};

export const validateOneOf = (options = []) => v =>
  !includes(options, v) && 'Is not a valid option.';

export const validateHexString = v =>
  !isHexString.test(v) && 'This is not a valid hex string.';

export const validateHexPrefix = v =>
  !isHexPrefixed.test(v) && 'Must include 0x prefix.';

export const validateEthereumAddress = v =>
  !isValidAddress(v) && 'This is not a valid Ethereum address.';

export const validateEmail = v =>
  !emailRegExp.test(v) && 'This is not a valid email address.';

export const validateExactly = (value, error) => v => v !== value && error;

export const validateNotAny = (values = []) => v =>
  values.includes(v) && `Cannot be ${v}.`;

export const validateLength = l => v =>
  v.length !== l && `Must be exactly ${l} characters.`;

export const validateHexLength = l => v =>
  v.length !== l + 2 && `Must be exactly ${l} hex characters.`;

export const validateMaximumLength = l => v =>
  v.length > l && `Must be ${l} characters or fewer.`;

export const validateMinimumLength = l => v =>
  v.length < l && `Must be ${l} characters or more.`;

export const validateGreaterThan = l => v =>
  !(v > l) && `Must be at least ${l}.`;

export const validateLessThan = l => v => !(v < l) && `Must be less than ${l}`;

export const validateInSet = (set, error) => v => !set.has(v) && error;

export const validateMaximumPatpByteLength = byteLength =>
  validateMaximumLength(patpStringLength(byteLength));

export const validateMinimumPatpByteLength = byteLength =>
  validateMinimumLength(patpStringLength(byteLength));

export const validateNotNullAddress = validateNotAny([
  ETH_ZERO_ADDR,
  ETH_ZERO_ADDR_SHORT,
]);

export const validateUnique = arr => {
  const res = [...new Set(arr)].length !== arr.length && 'Must be unique';
  return res;
};

export const validateChild = ourShip => ship =>
  ourShip !== ob.sein(ship) && `This point is not a child of ${ourShip}.`;
