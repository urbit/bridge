import * as bip39 from 'bip39';
import * as ob from 'urbit-ob';

import { isValidAddress } from './wallet';

// via: https://emailregex.com/
const emailRegExp = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

// is this hex?
const hexRegExp = /[0-9A-Fa-f]{64}/g;

// Wraps single validation functions in a controlled and predictable way.
export const simpleValidatorWrapper = config => {
  // If a previous validation has already failed, skip this validation and
  // return the prev message to the next stage in the validation function chain.
  // Failed validations should drop all the way down the chain and drop out of
  // the output.
  if (!config.prevMessage.pass) {
    return config.prevMessage;
  }

  // Run the validator and return the result.
  return config.validator(config.prevMessage.data)
    ? newMessage(config.prevMessage.data, true, null)
    : newMessage(config.prevMessage.data, false, config.error);
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
        return d.length > 1;
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
        point = parseInt(ob.patp2dec(d), 10);
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

export const validateLength = (m, l) =>
  simpleValidatorWrapper({
    prevMessage: m,
    validator: d => {
      try {
        return d.length === l;
      } catch {
        return false;
      }
    },
    error: 'This is of an invalid length',
  });

export const validateNetworkKey = m =>
  simpleValidatorWrapper({
    prevMessage: m,
    validator: d => hexRegExp.test(d),
    error: 'This is not a valid network key',
  });

export const validateNetworkSeed = m =>
  simpleValidatorWrapper({
    prevMessage: m,
    validator: d => hexRegExp.test(d),
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
