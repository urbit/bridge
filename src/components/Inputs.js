import React from 'react';
import { Input } from 'indigo-react';
import * as bip39 from 'bip39';

import { validateNotEmpty, validateMnemonic } from 'lib/validators';
import { DEFAULT_HD_PATH } from 'lib/wallet';

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

// const PointInput = advancedInput({
//   WrappedComponent: Input,
//   validators: [validatePoint, validateNotEmpty],
//   transformers: [prependSig],
// });

// const TicketInput = advancedInput({
//   WrappedComponent: Input,
//   validators: [validateTicket, validateNotEmpty],
//   transformers: [prependSig],
// });
