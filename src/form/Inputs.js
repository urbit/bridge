import React, { useMemo } from 'react';
import { Input, AccessoryIcon } from 'indigo-react';
import { useField } from 'react-final-form';

import {
  validateNotEmpty,
  validateTicket,
  kDefaultValidator,
  validateMnemonic,
} from 'lib/validators';
import { compose } from 'lib/lib';
import { prependSig } from 'lib/transformers';
import { DEFAULT_HD_PATH } from 'lib/wallet';

// TODO: why is `validate` called when routing away? new props?
// active not true: https://github.com/final-form/react-final-form/issues/558

const kEmptyValidators = []; // necessary for referential stability
const kEmptyTransformers = []; // also for referential stability

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
  fn = x => undefined
) => async value => {
  // console.log('validating:', value);
  return (
    compose(
      ...validators,
      kDefaultValidator
    )(value).error || (await fn(value))
  );
};

const kTicketValidators = [validateTicket, validateNotEmpty];
export function TicketInput({
  name,
  validators = kEmptyValidators,
  transformers = kEmptyTransformers,
  validate,
  ...rest
}) {
  const { valid, error, validating } = useField(name, {
    subscription: { error: true, validating: true },
  });

  const _validate = useMemo(
    () => buildValidator([...validators, ...kTicketValidators], validate),
    [validate, validators]
  );

  const _format = (value, name) => prependSig(value);

  return (
    <Input
      type="text"
      name={name}
      placeholder={PLACEHOLDER_TICKET}
      accessory={
        error ? (
          <AccessoryIcon.Failure />
        ) : validating ? (
          <AccessoryIcon.Pending />
        ) : valid ? (
          <AccessoryIcon.Success />
        ) : null
      }
      config={{ validate: _validate, format: _format }}
      mono
      {...rest}
    />
  );
}

const kMnemonicValidators = [validateMnemonic, validateNotEmpty];
export function MnemonicInput({
  name,
  validators = kEmptyValidators,
  transformers = kEmptyTransformers,
  validate,
  ...rest
}) {
  const _validate = useMemo(
    () => buildValidator([...validators, ...kMnemonicValidators], validate),
    [validate, validators]
  );

  return (
    <Input
      type="textarea"
      name={name}
      placeholder={PLACEHOLDER_MNEMONIC}
      config={{ validate: _validate }}
      autoComplete="off"
      mono
      {...rest}
    />
  );
}

const kHdPathValidators = [validateNotEmpty];
export function HdPathInput({
  name,
  validators = kEmptyValidators,
  transformers = kEmptyTransformers,
  validate,
  ...rest
}) {
  const _validate = useMemo(
    () => buildValidator([...validators, ...kHdPathValidators], validate),
    [validate, validators]
  );

  return (
    <Input
      type="text"
      name={name}
      placeholder={PLACEHOLDER_HD_PATH}
      config={{ validate: _validate }}
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
