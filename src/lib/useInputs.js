import React, { useCallback, useMemo } from 'react';
import { AccessoryIcon, useForm } from 'indigo-react';
import { identity } from 'lodash';

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

const PLACEHOLDER_POINT = '~sampel-ponnym';
const PLACEHOLDER_HD_PATH = DEFAULT_HD_PATH;
const PLACEHOLDER_MNEMONIC =
  'example crew supreme gesture quantum web media hazard theory mercy wing kitten';
const PLACEHOLDER_TICKET = '~sampel-ticlyt-migfun-falmel';
const PLACEHOLDER_ADDRESS = '0x12345abcdeDB11D175F123F6891AA64F01c24F7d';
const PLACEHOLDER_PRIVATE_KEY =
  '0x12345abcdee6beb2f323fab48b432925c9785808d33a6ca6d7ba00b45e9370c3';

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

const kMnemonicValidators = [validateMnemonic, validateNotEmpty];
export function useMnemonicInput(props) {
  return useFirstOf(
    useForm([
      {
        type: 'textarea',
        autoComplete: 'off',
        placeholder: PLACEHOLDER_MNEMONIC,
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
        placeholder: PLACEHOLDER_HD_PATH,
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
        placeholder: PLACEHOLDER_TICKET,
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

const kPointTransformers = [prependSig];
export function usePointInput({ size = 4, validators = [], ...rest }) {
  const _validators = useMemo(
    () => [
      ...validators,
      validatePoint,
      validateMaximumPatpByteLength(size),
      validateNotEmpty,
    ],
    [size, validators]
  );

  return useFirstOf(
    useForm([
      {
        type: 'text',
        label: 'Point',
        placeholder: PLACEHOLDER_POINT,
        validators: _validators,
        transformers: kPointTransformers,
        mono: true,
        ...rest,
      },
    ]),
    ({ error, pass, focused, value }) => ({
      accessory: value ? (
        <InputSigil
          patp={value}
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

export function useGalaxyInput(props) {
  return usePointInput({
    label: 'Galaxy Name',
    size: 1,
    ...props,
  });
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
            validateOneOf(options.map(option => option.value)),
            validateNotEmpty,
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
        placeholder: PLACEHOLDER_ADDRESS,
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
