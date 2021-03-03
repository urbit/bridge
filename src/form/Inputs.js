import React from 'react';
import { Input, AccessoryIcon } from 'indigo-react';
import { useField } from 'react-final-form';

import {
  convertToNumber,
  buildFormatter,
  downcase,
  ensurePatFormat,
  stripHexPrefix,
  ensureHexPrefix,
} from 'form/formatters';
import { DEFAULT_HD_PATH } from 'lib/wallet';
import InputSigil from 'components/InputSigil';

const PLACEHOLDER_POINT = '~sampel-ponnym';
const PLACEHOLDER_HD_PATH = DEFAULT_HD_PATH;
const PLACEHOLDER_MNEMONIC =
  'example crew supreme gesture quantum web media hazard theory mercy wing kitten';
const PLACEHOLDER_TICKET = '~sampel-ticlyt-migfun-falmel';
const PLACEHOLDER_PASSWORD = '••••••-••••••-••••••-••••••';
const PLACEHOLDER_ADDRESS = '0x';
const PLACEHOLDER_HEX = '0x';
const PLACEHOLDER_PRIVATE_KEY =
  'a44de2416ee6beb2f323fab48b432925c9785808d33a6ca6d7ba00b45e9370c3';
const PLACEHOLDER_EMAIL = 'email@example.com';

const formatPat = buildFormatter([downcase, ensurePatFormat]);

export function TicketInput({ name, hidden, ...rest }) {
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
      type={hidden ? 'password' : 'text'}
      name={name}
      obscure={value => value.replace(/[^~-]+/g, '••••••')}
      placeholder={hidden ? PLACEHOLDER_PASSWORD : PLACEHOLDER_TICKET}
      autoCapitalize="none"
      autoCorrect="off"
      accessory={
        touched && !active && error ? (
          <AccessoryIcon.Failure />
        ) : validating ? (
          <AccessoryIcon.Pending />
        ) : valid ? (
          <AccessoryIcon.Success />
        ) : null
      }
      config={{ parse: formatPat }}
      mono
      {...rest}
    />
  );
}

export function MnemonicInput({ ...rest }) {
  return (
    <Input
      type="textarea"
      placeholder={PLACEHOLDER_MNEMONIC}
      autoCapitalize="none"
      autoComplete="off"
      mono
      {...rest}
    />
  );
}

export function HdPathInput({ ...rest }) {
  return (
    <Input
      type="text"
      placeholder={PLACEHOLDER_HD_PATH}
      autoCapitalize="none"
      autoComplete="off"
      autoCorrect="off"
      {...rest}
    />
  );
}

export function PassphraseInput({ ...rest }) {
  return (
    <Input
      type="password"
      placeholder="Passphrase"
      autoCapitalize="none"
      autoCorrect="off"
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
      label="Urbit ID"
      name={name}
      placeholder={PLACEHOLDER_POINT}
      autoCapitalize="none"
      autoComplete="off"
      autoCorrect="off"
      accessory={
        value ? (
          <InputSigil
            patp={value}
            size={44}
            valid={valid}
            error={error}
            active={active}
          />
        ) : null
      }
      config={{ parse: formatPat }}
      mono
      {...rest}
    />
  );
}

export function HexInput({ ...rest }) {
  return (
    <Input
      type="text"
      placeholder={PLACEHOLDER_HEX}
      autoCapitalize="none"
      autoComplete="off"
      autoCorrect="off"
      mono
      config={{ parse: ensureHexPrefix }}
      {...rest}
    />
  );
}

export function PrivateKeyInput({ ...rest }) {
  return (
    <HexInput
      type="password"
      placeholder={PLACEHOLDER_PRIVATE_KEY}
      config={{ parse: stripHexPrefix }}
      {...rest}
    />
  );
}

export function PsbtInput({ ...rest }) {
  return (
    <HexInput
      type="text"
      placeholder=""
      config={{ parse: stripHexPrefix }}
      {...rest}
    />
  );
}

export function AddressInput({ ...rest }) {
  return (
    <Input
      type="text"
      placeholder={PLACEHOLDER_ADDRESS}
      autoCapitalize="none"
      autoCorrect="off"
      mono
      {...rest}
    />
  );
}

export function NumberInput({ ...rest }) {
  return (
    <Input
      type="number"
      label="Number"
      config={{ format: convertToNumber }}
      {...rest}
    />
  );
}

export function EmailInput({ ...rest }) {
  return (
    <Input
      type="email"
      placeholder={PLACEHOLDER_EMAIL}
      autoCapitalize="none"
      {...rest}
    />
  );
}
