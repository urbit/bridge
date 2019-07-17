import React, { useCallback, useMemo } from 'react';
import { AccessoryIcon, useForm } from 'indigo-react';
import { identity } from 'lodash';
import * as bip39 from 'bip39';

import { DEFAULT_HD_PATH } from 'lib/wallet';
import {
  validateNotEmpty,
  validateMnemonic,
  validatePoint,
  validateTicket,
  validateEmail,
  validateLength,
  validateHexString,
  validateOneOf,
  validateMaximumPatpByteLength,
  validateEthereumAddress,
  validateNotNullAddress,
  validateGreaterThan,
} from 'lib/validators';
import { prependSig, convertToNumber } from 'lib/transformers';

import InputSigil from 'components/InputSigil';

const EXAMPLE_PRIVATE_KEY =
  '0xa44de2416ee6beb2f323fab48b432925c9785808d33a6ca6d7ba00b45e9370c3';

// pulls out the first input from a useForm() call
function useFirstOf({ inputs, setValue, ...rest }, mapper = identity) {
  // ask the mapper function for any values to overwrite
  const input = {
    ...inputs[0],
    ...mapper(inputs[0]),
  };
  // memoize the setValue callback for manually setting the value
  // in response to some imperative event
  const _setValue = useCallback(value => setValue(input.name, value), [
    setValue,
    input.name,
  ]);

  // provide the first input as the first element
  // _and_ as the second element to facilitate destructuring
  // and then provide the pass/error/setValue/etc properties at the end
  return [
    input,
    input,
    {
      ...rest,
      setValue: _setValue,
    },
  ];
}

export function usePassphraseInput(props) {
  return useFirstOf(
    useForm([
      {
        type: 'password',
        autoComplete: 'off',
        placeholder: 'Passphrase',
        ...props,
      },
    ])
  );
}

export function useHexInput({ length, ...rest }) {
  return useFirstOf(
    useForm([
      {
        type: 'text', // or password
        autoComplete: 'off',
        placeholder: `e.g. ${EXAMPLE_PRIVATE_KEY}`,
        validators: useMemo(
          () => [
            validateHexString,
            validateLength(length + 2),
            validateNotEmpty,
          ],
          [length]
        ),
        ...rest,
      },
    ])
  );
}

const kExampleMnemonic = bip39.generateMnemonic();
const kMnemonicValidators = [validateMnemonic, validateNotEmpty];
export function useMnemonicInput(props) {
  return useFirstOf(
    useForm([
      {
        type: 'text',
        autoComplete: 'off',
        placeholder: `e.g. ${kExampleMnemonic}`,
        validators: kMnemonicValidators,
        ...props,
      },
    ])
  );
}

export function useHdPathInput(props) {
  return useFirstOf(
    useForm([
      {
        type: 'text',
        autoComplete: 'off',
        placeholder: `e.g. ${DEFAULT_HD_PATH}`,
        ...props,
      },
    ])
  );
}

const kTicketValidators = [validateTicket, validateNotEmpty];
//TODO needs to be fancier, displaying sig and dashes instead of •ing all
const kTicketTransformers = [prependSig];
export function useTicketInput({ validators = [], deriving = false, ...rest }) {
  return useFirstOf(
    useForm([
      {
        type: 'password',
        label: 'Ticket',
        placeholder: 'e.g. ~ragtyd-modwen-bostec-hinsep',
        validators: useMemo(() => [...validators, ...kTicketValidators], [
          validators,
        ]),
        transformers: kTicketTransformers,
        mono: true,
        ...rest,
      },
    ]),
    ({ error, pass }) => ({
      accessory: error ? (
        <AccessoryIcon.Failure />
      ) : deriving ? (
        <AccessoryIcon.Pending />
      ) : pass ? (
        <AccessoryIcon.Success />
      ) : null,
    })
  );
}

const kPointValidators = [
  validatePoint,
  validateMaximumPatpByteLength(4),
  validateNotEmpty,
];
const kPointTransformers = [prependSig];
export function usePointInput(rest) {
  return useFirstOf(
    useForm([
      {
        type: 'text',
        label: 'Point',
        placeholder: 'e.g. ~zod',
        validators: kPointValidators,
        transformers: kPointTransformers,
        mono: true,
        ...rest,
      },
    ]),
    ({ error, pass, focused, data }) => ({
      accessory: data ? (
        <InputSigil
          patp={data}
          size={44}
          margin={8}
          pass={pass}
          focused={focused}
          error={error}
        />
      ) : null,
    })
  );
}

export function useCheckboxInput({ initialValue, ...rest }) {
  return useFirstOf(
    useForm([
      {
        type: 'checkbox',
        ...rest,
      },
    ])
  );
}

export function useSelectInput({ initialValue, options, ...rest }) {
  return useFirstOf(
    useForm([
      {
        type: 'select',
        validators: useMemo(
          () => [
            validateOneOf(
              options.map(option => option.value),
              validateNotEmpty
            ),
          ],
          [options]
        ),
        options,
        initialValue: initialValue || options[0].value,
        ...rest,
      },
    ])
  );
}

const kAddressValidators = [
  validateEthereumAddress,
  validateNotNullAddress,
  validateNotEmpty,
];
export function useAddressInput({ ...rest }) {
  return useFirstOf(
    useForm([
      {
        type: 'string',
        label: 'Ethereum Address',
        placeholder: 'e.g. 0x6DEfFb0caFDB11D175F123F6891AA64F01c24F7d',
        autoComplete: 'off',
        validators: kAddressValidators,
        mono: true,
        ...rest,
      },
    ])
  );
}

const kNumberTransformers = [convertToNumber];
const kNumberValidators = [validateGreaterThan(0)];
export function useNumberInput({ ...rest }) {
  return useFirstOf(
    useForm([
      {
        type: 'number',
        label: 'Number',
        autoComplete: 'off',
        transformers: kNumberTransformers,
        validators: kNumberValidators,
        ...rest,
      },
    ])
  );
}

const kEmailValidators = [validateEmail, validateNotEmpty];
export const buildEmailInputConfig = extra => ({
  type: 'email',
  autoComplete: 'off',
  validators: kEmailValidators,
  initialValue: '',
  ...extra,
});
