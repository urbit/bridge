import { some } from 'lodash';

import {
  validateNotEmpty,
  validateTicket,
  kDefaultValidator,
  validateMnemonic,
  validatePoint,
  validateMaximumPatpByteLength,
  validateOneOf,
  validateHexString,
  validateHexLength,
  validateEthereumAddress,
  validateGreaterThan,
  validateEmail,
} from 'lib/validators';
import { compose } from 'lib/lib';

const buildValidator = (
  validators = [],
  fn = () => undefined
) => async value => {
  return (
    compose(
      ...validators,
      kDefaultValidator
    )(value).error || (await fn(value))
  );
};

// error object has errors if some of its fields are
// 1) an array with any defined values
// 2) any defined values
export const hasErrors = iter =>
  some(iter, v => (Array.isArray(v) ? hasErrors(v) : v !== undefined));

export const buildTicketValidator = (validators = []) =>
  buildValidator([...validators, validateTicket, validateNotEmpty]);
export const buildMnemonicValidator = () =>
  buildValidator([validateMnemonic, validateNotEmpty]);
export const buildCheckboxValidator = mustBe =>
  buildValidator([
    validateOneOf(mustBe !== undefined ? [mustBe] : [true, false]),
  ]);
export const buildPassphraseValidator = () => buildValidator([]);
// TODO: validate hdpath format
export const buildHdPathValidator = () => buildValidator([validateNotEmpty]);
export const buildPointValidator = (size = 4, validate) =>
  buildValidator(
    [validatePoint, validateMaximumPatpByteLength(size), validateNotEmpty],
    validate
  );
export const buildSelectValidator = options =>
  buildValidator([validateOneOf(options.map(option => option.value))]);
export const buildHexValidator = length =>
  buildValidator([
    validateHexLength(length),
    validateHexString,
    validateNotEmpty,
  ]);
export const buildUploadValidator = () => buildValidator([validateNotEmpty]);
export const buildAddressValidator = () =>
  buildValidator([
    validateEthereumAddress,
    validateHexLength(40),
    validateHexString,
    validateNotEmpty,
  ]);
export const buildNumberValidator = (min = 0) =>
  buildValidator([validateGreaterThan(min)]);
export const buildEmailValidator = () =>
  buildValidator([validateEmail, validateNotEmpty]);

// the default form validator just returns field-level validations
const kDefaultFormValidator = (values, errors) => errors;
export const composeValidator = (
  fieldValidators = {},
  formValidator = kDefaultFormValidator
) => {
  const names = Object.keys(fieldValidators);

  const fieldLevelValidators = names.map(name => value =>
    fieldValidators[name](value)
  );

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

  return async values => {
    const errors = await fieldLevelValidator(values);
    return await formValidator(values, errors);
  };
};
