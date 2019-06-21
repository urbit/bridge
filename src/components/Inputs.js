import React from 'react';
import { Input } from 'indigo-react';
import * as bip39 from 'bip39';

import { DEFAULT_HD_PATH } from 'lib/wallet';
import {
  validateNotEmpty,
  validateMnemonic,
  validatePoint,
  validateTicket,
} from 'lib/validators';
import { prependSig } from 'lib/transformers';

const kExampleMnemonic = bip39.generateMnemonic();

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

export function PassphraseInput(props) {
  return (
    <Input
      type="password"
      autoComplete="off"
      placeholder="Passphrase"
      {...props}
    />
  );
}

export function MnemonicInput(props) {
  return (
    <Input
      type="text"
      autoComplete="off"
      placeholder={`e.g. ${kExampleMnemonic}`}
      validators={[validateMnemonic, validateNotEmpty]}
      {...props}
    />
  );
}

export function HdPathInput(props) {
  return (
    <Input
      type="text"
      autoComplete="off"
      placeholder={`${DEFAULT_HD_PATH}`}
      validators={[validateNotEmpty]}
      {...props}
    />
  );
}

// const GalaxyInput = advancedInput({
//   WrappedComponent: Input,
//   validators: [validateGalaxy, validateNotEmpty],
//   transformers: [prependSig],
// });

export function PointInput(props) {
  return (
    <Input
      type="text"
      placeholder="e.g. ~zod"
      initialValue={props.initialValue || '~'}
      validators={[validatePoint, validateNotEmpty]}
      transformers={[prependSig]}
      mono
      {...props}
    />
  );
}

//TODO needs to be fancier, displaying sig and dashes instead of •ing all
export function TicketInput(props) {
  return (
    <Input
      type="password"
      placeholder="~master-ticket"
      validators={[validateTicket, validateNotEmpty]}
      transformers={[prependSig]}
      mono
      {...props}
    />
  );
}
