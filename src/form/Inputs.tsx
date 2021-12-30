import React, { useCallback } from 'react';
import * as ob from 'urbit-ob';
import { Input, AccessoryIcon } from 'indigo-react';
import { useField, useForm } from 'react-final-form';

import {
  convertToNumber,
  buildFormatter,
  downcase,
  ensurePatFormat,
  stripHexPrefix,
  ensureHexPrefix,
  ticketToSegments,
} from 'form/formatters';
import { DEFAULT_HD_PATH } from 'lib/constants';
import InputSigil from 'components/InputSigil';
import {
  StatelessTextInput,
  StatelessTextInputProps,
} from '@tlon/indigo-react';

const PLACEHOLDER_GALAXY = '~pel';
const PLACEHOLDER_STAR = '~sampel';
export const PLACEHOLDER_PLANET = '~sampel-ponnym';
const PLACEHOLDER_HD_PATH = DEFAULT_HD_PATH;
const PLACEHOLDER_MNEMONIC =
  'example crew supreme gesture quantum web media hazard theory mercy wing kitten';
export const PLACEHOLDER_TICKET = '~sampel-ticlyt-migfun-falmel';
const PLACEHOLDER_PASSWORD = '••••••-••••••-••••••-••••••';
const PLACEHOLDER_ADDRESS = '0x';
const PLACEHOLDER_HEX = '0x';
const PLACEHOLDER_PRIVATE_KEY =
  'a44de2416ee6beb2f323fab48b432925c9785808d33a6ca6d7ba00b45e9370c3';
const PLACEHOLDER_EMAIL = 'email@example.com';

const formatPat = buildFormatter([downcase, ensurePatFormat]);

export function TicketInput({ name, hidden, className, ...rest }) {
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
      className={className}
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
      placeholder={
        size === 1
          ? PLACEHOLDER_GALAXY
          : size === 2
          ? PLACEHOLDER_STAR
          : PLACEHOLDER_PLANET
      }
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

export function HexInput({ type = 'text', ...rest }) {
  return (
    <Input
      type={type}
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
      type="textarea"
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

type TicketSegmentInputProps = {
  className?: string;
  name: string;
  rest: StatelessTextInputProps;
};

export function TicketSegmentInput({
  className,
  name,
  ...rest
}: TicketSegmentInputProps) {
  const { input } = useField(name);
  const { change } = useForm();

  const onPaste = useCallback(
    (event: React.ClipboardEvent<HTMLInputElement>) => {
      try {
        const pasteBuffer = event.clipboardData.getData('text');
        const patp = ensurePatFormat(pasteBuffer);
        if (!ob.isValidPatp(patp)) {
          throw new Error('invalid patp');
        }

        // prevent pasting the entire clipboard text into the field
        event.preventDefault();

        const segments = ticketToSegments(pasteBuffer);
        segments.forEach((s, i) => {
          change(`ticket${i}`, s);
        });
      } catch (error) {
        console.log(`skipping ticket autofill: ${error}`);
      }
    },
    [change]
  );

  // Advance the focused field after typing 6 characters
  const onChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const currentIndex = Number(name.replace('ticket', ''));
      if (currentIndex < 3 && event.target.value.length === 6) {
        const nextField = document.querySelector(
          `input[name=ticket${currentIndex + 1}]`
        );

        if (nextField !== null) {
          nextField.focus();
        }
      }
    },
    [name]
  );

  // Run the react-final-form onChange handler,
  // and our own custom one to advance the form cursor
  const mergedInput = {
    ...input,
    onChange: e => {
      input.onChange(e);
      onChange(e);
    },
  };

  return (
    <StatelessTextInput
      className={className}
      {...mergedInput}
      autoCapitalize="none"
      autoCorrect="off"
      type="text"
      maxLength="6"
      onPaste={onPaste}
      {...rest}
    />
  );
}

export const HiddenInput = ({ ...rest }) => {
  return <StatelessTextInput type="hidden" {...rest} />;
};
