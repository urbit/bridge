import * as bip39 from 'bip39';
import * as ob from 'urbit-ob';
import { identity, includes } from 'lodash';

import { isValidAddress, ETH_ZERO_ADDR, ETH_ZERO_ADDR_SHORT } from './wallet';
import patp2dec from './patp2dec';
import { patpStringLength } from './lib';

// NOTE: do not use the /g modifier for these regexes
// https://stackoverflow.com/a/21373261
// https://stackoverflow.com/a/1520853

// via: https://emailregex.com/
const emailRegExp = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

// is this 64 hex chars?
const plain64CharHexValue = /[0-9A-Fa-f]{64}/;

// is this only hex values with a 0x prefix?
const isHexString = /0x[0-9A-Fa-f]/;

// Wraps single validation functions in a controlled and predictable way.
export const simpleValidatorWrapper = ({
  prevMessage,
  transform = identity,
  validator,
  error,
}) => {
  // If a previous validation has already failed, skip this validation and
  // return the prev message to the next stage in the validation function chain.
  // Failed validations should drop all the way down the chain and drop out of
  // the output.
  if (!prevMessage.pass) {
    return prevMessage;
  }

  // Run the validator and return the result.
  const pass = validator(prevMessage.data);
  const data = pass ? transform(prevMessage.data) : prevMessage.data;

  return newMessage(data, pass, !pass && error);
};

// Validation message
// {
//   data: ...
//   pass: ...
//   error: ...
// }
// Creates a new validation message in a uniform way.
const newMessage = (data, pass, error) => ({
  // The input data
  data,
  // Has the data passed validation?
  pass,
  // If data has failed a validator, the error message goes here.
  error,
});

// A validator that always passes.
export const kDefaultValidator = data => newMessage(data, true, null);

// Validates a bip39 mnemonic
export const validateMnemonic = m =>
  simpleValidatorWrapper({
    prevMessage: m,
    validator: d => bip39.validateMnemonic(d),
    error: 'This is not a valid mnemonic.',
  });

// Checks an empty field
export const validateNotEmpty = m =>
  simpleValidatorWrapper({
    prevMessage: m,
    validator: d => {
      try {
        return d.length > 0;
      } catch {
        return false;
      }
    },
    error: 'This field is required.',
  });

// Checks if a patp is a valid galaxy
export const validateGalaxy = m =>
  simpleValidatorWrapper({
    prevMessage: m,
    validator: d => {
      let point;
      try {
        point = patp2dec(d);
        return point >= 0 && point < 256;
      } catch (e) {
        return false;
      }
    },
    error: 'This is not a valid galaxy',
  });

export const validatePoint = m =>
  simpleValidatorWrapper({
    prevMessage: m,
    validator: d => {
      try {
        return ob.isValidPatp(d);
      } catch (e) {
        return false;
      }
    },
    error: 'This is not a valid point',
  });

export const validateTicket = m =>
  simpleValidatorWrapper({
    prevMessage: m,
    validator: d => {
      try {
        return ob.isValidPatq(d);
      } catch (e) {
        return false;
      }
    },
    error: 'This is not a valid ticket',
  });

export const validateShard = m =>
  simpleValidatorWrapper({
    prevMessage: m,
    validator: d => {
      try {
        return ob.isValidPatq(d);
      } catch (e) {
        return false;
      }
    },
    error: 'This is not a valid shard',
  });

export const validateOneOf = (options = []) => m =>
  simpleValidatorWrapper({
    prevMessage: m,
    validator: d => includes(options, d),
    error: `Is not a valid option.`,
  });

export const validateHexString = m =>
  simpleValidatorWrapper({
    prevMessage: m,
    validator: d => isHexString.test(d),
    error: 'This is not a valid hex string',
  });

// @deprecate
export const validateNetworkKey = m =>
  simpleValidatorWrapper({
    prevMessage: m,
    validator: d => plain64CharHexValue.test(d),
    error: 'This is not a valid network key',
  });

// @deprecate
export const validateNetworkSeed = m =>
  simpleValidatorWrapper({
    prevMessage: m,
    validator: d => plain64CharHexValue.test(d),
    error: 'This is not a valid network seed',
  });

// Checks if a string is a valid ethereum address
export const validateEthereumAddress = m =>
  simpleValidatorWrapper({
    prevMessage: m,
    validator: d => isValidAddress(d),
    error: 'This is not a valid Ethereum address',
  });

export const validateEmail = m =>
  simpleValidatorWrapper({
    prevMessage: m,
    validator: d => emailRegExp.test(d),
    error: 'This is not a valid email address',
  });

export const validateInt = m =>
  simpleValidatorWrapper({
    prevMessage: m,
    transform: d => parseInt(d, 10),
    validator: d => {
      try {
        parseInt(d, 10);
        return;
      } catch {
        return false;
      }
    },
    error: 'This is not a valid number',
  });

export const validateExactly = (value, error) => m =>
  simpleValidatorWrapper({
    prevMessage: m,
    validator: d => d === value,
    error,
  });

export const validateNotAny = (values = []) => m =>
  simpleValidatorWrapper({
    prevMessage: m,
    validator: d => !values.includes(d),
    error: `Cannot be ${m.data}`,
  });

export const validateLength = l => m =>
  simpleValidatorWrapper({
    prevMessage: m,
    validator: d => {
      try {
        return d.length === l;
      } catch {
        return false;
      }
    },
    error: `Must be exactly ${l} characters`,
  });

export const validateMaximumLength = l => m =>
  simpleValidatorWrapper({
    prevMessage: m,
    validator: d => {
      try {
        return d.length <= l;
      } catch {
        return false;
      }
    },
    error: `Must be ${l} characters or fewer.`,
  });

export const validateGreaterThan = l => m =>
  simpleValidatorWrapper({
    prevMessage: m,
    validator: d => d > l,
    error: `Must be at least ${l}`,
  });

export const validatePatpByteLength = byteLength => {
  return validateLength(patpStringLength(byteLength));
};

export const validateMaximumPatpByteLength = byteLength => {
  return validateMaximumLength(patpStringLength(byteLength));
};

export const validateNotNullAddress = validateNotAny([
  ETH_ZERO_ADDR,
  ETH_ZERO_ADDR_SHORT,
]);
