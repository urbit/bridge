import React, { useState } from 'react';
import * as bip39 from 'bip39';

import InputSigil from 'components/InputSigil';

import { DEFAULT_HD_PATH } from 'lib/wallet';
import {
  validateNotEmpty,
  validateMnemonic,
  validatePoint,
  validateTicket,
  validateEmail,
} from 'lib/validators';
import { prependSig } from 'lib/transformers';
import useForm from 'indigo-react/lib/useForm';

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

// const GalaxyInput = advancedInput({
//   WrappedComponent: Input,
//   validators: [validateGalaxy, validateNotEmpty],
//   transformers: [prependSig],
// });

const kTicketValidators = [validateTicket, validateNotEmpty];
const kTicketTransformers = [prependSig];
//TODO needs to be fancier, displaying sig and dashes instead of •ing all
export function useTicketInput({ initialValue = '~', ...rest }) {
  return firstOf(
    useForm([
      {
        type: 'password',
        label: 'Ticket',
        placeholder: '~master-ticket',
        validators: kTicketValidators,
        transformers: kTicketTransformers,
        mono: true,
        initialValue,
        ...rest,
      },
    ])
  );
}

const kPointValidators = [validatePoint, validateNotEmpty];
const kPointTransformers = [prependSig];
export function usePointInput({ initialValue = '~', ...rest }) {
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
        initialValue,
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

const kEmailValidators = [validateEmail, validateNotEmpty];
export const buildEmailInputConfig = extra => ({
  type: 'email',
  autoComplete: 'off',
  validators: kEmailValidators,
  initialValue: '',
  ...extra,
});

// const TicketInput = advancedInput({
//   WrappedComponent: Input,
//   validators: [validateTicket, validateNotEmpty],
//   transformers: [prependSig],
// });
