import React from 'react';
import { Input, AccessoryIcon } from 'indigo-react';
import { useField } from 'react-final-form';
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
} from 'lib/validators';
import { compose } from 'lib/lib';
import { prependSig } from 'lib/transformers';
import { DEFAULT_HD_PATH } from 'lib/wallet';
import InputSigil from 'components/InputSigil';

const PLACEHOLDER_POINT = '~sampel-ponnym';
const PLACEHOLDER_HD_PATH = DEFAULT_HD_PATH;
const PLACEHOLDER_MNEMONIC =
  'example crew supreme gesture quantum web media hazard theory mercy wing kitten';
const PLACEHOLDER_TICKET = '~sampel-ticlyt-migfun-falmel';
const PLACEHOLDER_ADDRESS = '0x12345abcdeDB11D175F123F6891AA64F01c24F7d';
const PLACEHOLDER_PRIVATE_KEY =
  '0x12345abcdee6beb2f323fab48b432925c9785808d33a6ca6d7ba00b45e9370c3';

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

export const hasErrors = obj => some(obj, v => v !== undefined);

export const buildTicketValidator = (validators = []) =>
  buildValidator([...validators, validateTicket, validateNotEmpty]);
export const buildMnemonicValidator = () =>
  buildValidator([validateMnemonic, validateNotEmpty]);
export const buildCheckboxValidator = () =>
  buildValidator([validateOneOf([true, false])]);
export const buildPassphraseValidator = () => buildValidator([]);
// TODO: validate hdpath format
export const buildHdPathValidator = () => buildValidator([validateNotEmpty]);
export const buildPointValidator = (size = 4) =>
  buildValidator([
    validatePoint,
    validateMaximumPatpByteLength(size),
    validateNotEmpty,
  ]);
export const buildSelectValidator = options =>
  buildValidator([validateOneOf(options.map(option => option.value))]);
export const buildHexValidator = length =>
  buildValidator([
    validateHexLength(length),
    validateHexString,
    validateNotEmpty,
  ]);
export const buildUploadValidator = () => buildValidator([validateNotEmpty]);

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
    console.log('validating...');
    const errors = await fieldLevelValidator(values);
    return await formValidator(values, errors);
  };
};

export function TicketInput({ name, ...rest }) {
  const {
    meta: { valid, error, validating, touched, active },
  } = useField(name, {
    subscription: {
      valid: true,
      error: true,
      validating: true,
      touched: true,
      active: true,
    },
  });

  return (
    <Input
      type="text"
      name={name}
      placeholder={PLACEHOLDER_TICKET}
      accessory={
        touched && !active && error ? (
          <AccessoryIcon.Failure />
        ) : validating ? (
          <AccessoryIcon.Pending />
        ) : valid ? (
          <AccessoryIcon.Success />
        ) : null
      }
      config={{ format: prependSig }}
      mono
      {...rest}
    />
  );
}

export function MnemonicInput({ ...rest }) {
  return (
    <Input type="textarea" placeholder={PLACEHOLDER_MNEMONIC} mono {...rest} />
  );
}

export function HdPathInput({ ...rest }) {
  return (
    <Input
      type="text"
      placeholder={PLACEHOLDER_HD_PATH}
      autoComplete="off"
      {...rest}
    />
  );
}

export function PassphraseInput({ ...rest }) {
  return (
    <Input
      type="password"
      placeholder="Passphrase"
      autoComplete="off"
      {...rest}
    />
  );
}

export function PointInput({ name, size = 4, ...rest }) {
  const {
    input: { value },
    meta: { active, valid, error },
  } = useField(name, {
    subscription: { value: true, active: true, valid: true, error: true },
  });

  return (
    <Input
      type="text"
      label="Point"
      name={name}
      placeholder={PLACEHOLDER_POINT}
      accessory={
        value ? (
          <InputSigil
            patp={value}
            size={44}
            margin={8}
            pass={valid}
            focused={active}
            error={error}
          />
        ) : null
      }
      config={{ format: prependSig }}
      mono
      {...rest}
    />
  );
}

export function PrivateKeyInput({ ...rest }) {
  return (
    <Input
      type="text"
      placeholder={PLACEHOLDER_PRIVATE_KEY}
      autoComplete="off"
      {...rest}
    />
  );
}
