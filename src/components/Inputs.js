import React, { useState, useMemo } from 'react';
import { AccessoryIcon, useForm } from 'indigo-react';
import * as bip39 from 'bip39';

import InputSigil from 'components/InputSigil';

import { DEFAULT_HD_PATH } from 'lib/wallet';
import {
  validateNotEmpty,
  validateMnemonic,
  validatePoint,
  validateTicket,
  validateEmail,
  validateLength,
  validateHexString,
} from 'lib/validators';
import { prependSig } from 'lib/transformers';

const EXAMPLE_PRIVATE_KEY =
  '0xa44de2416ee6beb2f323fab48b432925c9785808d33a6ca6d7ba00b45e9370c3';

// const RequiredInput = advancedInput({
//   WrappedComponent: Input,
//   validators: [validateNotEmpty],
// });

// const NetworkKeyInput = advancedInput({
//   WrappedComponent: Input,
//   validators: [validateNotEmpty, validateNetworkKey],
// });

// const NetworkSeedInput = advancedInput({
//   WrappedComponent: Input,
//   validators: [validateNotEmpty, validateNetworkSeed],
// });

// const AddressInput = advancedInput({
//   WrappedComponent: Input,
//   validators: [validateEthereumAddress, validateNotEmpty],
// });

// const GalaxyInput = advancedInput({
//   WrappedComponent: Input,
//   validators: [validateGalaxy, validateNotEmpty],
//   transformers: [prependSig],
// });

const firstOf = state => state.inputs[0];

export function usePassphraseInput(props) {
  return firstOf(
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
  return firstOf(
    useForm([
      {
        type: 'text', // or password
        autoComplete: 'off',
        placeholder: EXAMPLE_PRIVATE_KEY,
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
  return firstOf(
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
  return firstOf(
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
const kTicketTransformers = [prependSig];
//TODO needs to be fancier, displaying sig and dashes instead of •ing all
export function useTicketInput({ validators = [], deriving = false, ...rest }) {
  const input = firstOf(
    useForm([
      {
        type: 'password',
        label: 'Ticket',
        placeholder: '~ragtyd-modwen-bostec-hinsep',
        validators: useMemo(() => [...validators, ...kTicketValidators], [
          validators,
        ]),
        transformers: kTicketTransformers,
        mono: true,
        ...rest,
      },
    ])
  );

  const accessory = input.error ? (
    <AccessoryIcon.Failure />
  ) : deriving ? (
    <AccessoryIcon.Pending />
  ) : input.pass ? (
    <AccessoryIcon.Success />
  ) : null;

  return {
    ...input,
    accessory,
  };
}

const kPointValidators = [validatePoint, validateNotEmpty];
const kPointTransformers = [prependSig];
export function usePointInput(rest) {
  const [lastValidPoint, setLastValidPoint] = useState('');
  const input = firstOf(
    useForm([
      {
        type: 'text',
        label: 'Point',
        placeholder: 'e.g. ~zod',
        validators: kPointValidators,
        transformers: kPointTransformers,
        mono: true,
        onValue: setLastValidPoint,
        ...rest,
      },
    ])
  );

  const { pass, focused, error } = input;

  return {
    ...input,
    accessory: lastValidPoint && (
      <InputSigil
        patp={lastValidPoint}
        size={68}
        margin={8}
        pass={pass}
        focused={focused}
        error={error}
      />
    ),
  };
}

export function useCheckboxInput({ initialValue, ...rest }) {
  return firstOf(
    useForm([
      {
        type: 'checkbox',
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
