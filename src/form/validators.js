import { some } from 'lodash';

import {
  validateNotEmpty,
  validatePatq,
  validateMnemonic,
  validatePoint,
  validateMaximumPatpByteLength,
  validateOneOf,
  validateHexString,
  validateHexLength,
  validateEthereumAddress,
  validateGreaterThan,
  validateEmail,
  validateNotNullAddress,
} from 'lib/validators';

// iterate over validators, exiting early if there's an error
const buildValidator = (validators = []) => async value => {
  for (const validator of validators) {
    try {
      const error = await validator(value);
      if (error) {
        return error;
      }
    } catch (error) {
      return error.message;
    }
  }
};

// error object has errors if some of its fields are
// 1) an array with any defined values
// 2) any defined values
export const hasErrors = iter =>
  some(iter, v => (Array.isArray(v) ? hasErrors(v) : v !== undefined));

export const buildPatqValidator = (validators = []) =>
  buildValidator([validateNotEmpty, validatePatq, ...validators]);
export const buildMnemonicValidator = () =>
  buildValidator([validateNotEmpty, validateMnemonic]);
export const buildCheckboxValidator = mustBe =>
  buildValidator([
    validateOneOf(mustBe !== undefined ? [mustBe] : [true, false]),
  ]);
export const buildPassphraseValidator = () => buildValidator([]);
// TODO: validate hdpath format
export const buildHdPathValidator = () => buildValidator([validateNotEmpty]);
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
    validateHexString,
    validateHexLength(length),
  ]);
export const buildUploadValidator = () => buildValidator([validateNotEmpty]);
export const buildAddressValidator = () =>
  buildValidator([
    validateNotEmpty,
    validateHexString,
    validateHexLength(40),
    validateNotNullAddress,
    validateEthereumAddress,
  ]);
export const buildNumberValidator = (min = 0) =>
  buildValidator([validateGreaterThan(min)]);
export const buildEmailValidator = () =>
  buildValidator([validateNotEmpty, validateEmail]);

// the default form validator just returns field-level validations
const kDefaultFormValidator = (values, errors) => errors;

// the form validator is the composition of all of the field validators
// plus an additional form validator function
export const composeValidator = (
  fieldValidators = {},
  formValidator = kDefaultFormValidator
) => {
  const names = Object.keys(fieldValidators);

  const fieldLevelValidators = names.map(name => value =>
    fieldValidators[name](value)
  );

  // async reduce errors per-field into an errors object
  const fieldLevelValidator = async values => {
    const errors = await Promise.all(
      names.map((name, i) => fieldLevelValidators[i](values[name]))
    );

    return names.reduce(
      (memo, name, i) => ({
        ...memo,
        [name]: errors[i],
      }),
      {}
    );
  };

  // final-form `validate` function
  return async values => {
    // ask for field-level errors
    const errors = await fieldLevelValidator(values);
    // pass the current values and their validity to the form-level validator
    // that can implement conditional logic and more complex validations
    return await formValidator(values, errors);
  };
};
