import { some } from 'lodash';

import {
  validateNotEmpty,
  validatePatq,
  validateShard,
  validateMnemonic,
  validateHdPath,
  validatePoint,
  validateMaximumPatpByteLength,
  validateOneOf,
  validateHexString,
  validateHexLength,
  validateEthereumAddress,
  validateGreaterThan,
  validateLessThan,
  validateEmail,
  validateNotNullAddress,
  validateHexPrefix,
  validateLength,
  validateUnique,
} from 'lib/validators';
import isPromise from 'lib/isPromise';

const PRIVATE_KEY_CHAR_LENGTH = 64; // 64 hex characters
const ADDRESS_CHAR_LENGTH = 40; // 40 hex characters

// iterate over validators, exiting early if there's an error
const buildValidator = (validators = [], validate) => value => {
  for (const validator of validators) {
    try {
      const error = validator(value);
      if (error) {
        return error;
      }
    } catch (error) {
      console.error(error);
      return error.message;
    }
  }

  if (validate) {
    // the final validate function can optionally return a promise
    return validate(value);
  }
};

// maps a validator across an array of values
export const buildArrayValidator = validator => values => {
  const errorsOrPromises = values.map(validator);
  if (some(errorsOrPromises, isPromise)) {
    return Promise.all(errorsOrPromises);
  }

  return errorsOrPromises;
};

// error object has errors if some of its fields are
// 1) an array with any defined values
// 2) any defined values
export const hasErrors = iter =>
  some(iter, v => (Array.isArray(v) ? hasErrors(v) : v !== undefined));

export const buildPatqValidator = (validators = []) =>
  buildValidator([validateNotEmpty, validatePatq, ...validators]);
export const buildShardValidator = (validators = []) =>
  buildValidator([validateShard, ...validators]);
export const buildAnyMnemonicValidator = () =>
  buildValidator([validateNotEmpty]);
export const buildMnemonicValidator = () =>
  buildValidator([validateNotEmpty, validateMnemonic]);
export const buildCheckboxValidator = mustBe =>
  buildValidator([
    validateOneOf(mustBe !== undefined ? [mustBe] : [true, false]),
  ]);
export const buildPassphraseValidator = () => buildValidator([]);
// TODO: validate hdpath format
export const buildHdPathValidator = () => buildValidator([validateHdPath]);
export const buildPointValidator = (size = 4, validators = []) =>
  buildValidator([
    validateNotEmpty,
    validateMaximumPatpByteLength(size),
    validatePoint,
    ...validators,
  ]);
export const buildSelectValidator = options =>
  buildValidator([validateOneOf(options.map(option => option.value))]);
export const buildHexValidator = length =>
  buildValidator([
    validateNotEmpty,
    validateHexPrefix,
    validateHexString,
    validateHexLength(length),
  ]);
export const buildBytesValidator = () =>
  buildValidator([validateHexPrefix, validateHexString]);
export const buildPrivateKeyValidator = () =>
  buildValidator([
    validateNotEmpty,
    validateHexString,
    validateLength(PRIVATE_KEY_CHAR_LENGTH),
  ]);
export const buildUploadValidator = () => buildValidator([validateNotEmpty]);
export const buildAddressValidator = () =>
  buildValidator([
    validateNotEmpty,
    validateHexPrefix,
    validateHexString,
    validateHexLength(ADDRESS_CHAR_LENGTH),
    validateNotNullAddress,
    validateEthereumAddress,
  ]);
export const buildNumberValidator = (min = 0, max = null) => {
  let validators = [validateGreaterThan(min)];
  if (max !== null) {
    validators.push(validateLessThan(max));
  }
  return buildValidator(validators);
};

export const buildEmailValidator = validate =>
  buildValidator([validateNotEmpty, validateEmail], validate);

export const buildEmailArrayValidator = () =>
  buildValidator([validateUnique, buildArrayValidator(buildEmailValidator())]);
// the form validator is the composition of all of the field validators
// plus an additional form validator function
export const composeValidator = (
  fieldValidators = {},
  // the default form validator just returns field-level validations
  formValidator = (values, errors) => errors
) => {
  const names = Object.keys(fieldValidators);

  const fieldLevelValidators = names.map(name => value =>
    fieldValidators[name](value)
  );

  // async reduce errors per-field into an errors object
  const fieldLevelValidator = values => {
    const errorsOrPromises = names.map((name, i) =>
      fieldLevelValidators[i](values[name])
    );

    const reduce = errors =>
      names.reduce(
        (memo, name, i) => ({
          ...memo,
          [name]: errors[i],
        }),
        {}
      );

    if (some(errorsOrPromises, isPromise)) {
      // if any of these results are a promise, await them all then reduce
      return Promise.all(errorsOrPromises).then(reduce);
    }

    // otherwise return immediately
    return reduce(errorsOrPromises);
  };

  // the final-form `validate` function
  // NOTE: if we return a Promise to final-form it will toggle the `validating`
  // state, which is expected. If our promise resolves immediately, however,
  // that means our `validating` state flickers the UI and it looks pretty bad.
  // The solution is to conditionally return a promise only when necessary.
  return values => {
    // ask for field-level errors
    const errorsOrPromise = fieldLevelValidator(values);

    // pass the current values and their validity to the form-level validator
    // that can implement conditional logic and more complex validations
    const runFormValidator = errors => formValidator(values, errors);

    if (isPromise(errorsOrPromise)) {
      // if promise, promise
      return errorsOrPromise.then(runFormValidator);
    }

    // otherwise, it's an errors object
    return runFormValidator(errorsOrPromise);
  };
};
