import React, { useMemo } from 'react';
import { Input, AccessoryIcon } from 'indigo-react';
import { useField } from 'react-final-form';
import {
  validateNotEmpty,
  validateTicket,
  kDefaultValidator,
} from 'lib/validators';
import { compose } from 'lib/lib';

const PLACEHOLDER_TICKET = '~sampel-ticlyt-migfun-falmel';

const buildValidator = (
  validators = [],
  fn = x => undefined
) => async value => {
  console.log('validating', value);
  return (
    compose(
      ...validators,
      kDefaultValidator
    )(value).error || (await fn(value))
  );
};

const kTicketValidators = [validateTicket, validateNotEmpty];
export function TicketInput({ name, validators = [], config = {}, ...rest }) {
  const { valid, error, validating } = useField(name, {
    subscription: { error: true, validating: true },
  });

  const validate = useMemo(
    () =>
      buildValidator([...validators, ...kTicketValidators], config.validate),
    [config.validate, validators]
  );

  return (
    <Input
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
      config={{ validate }}
      mono
      {...rest}
    />
  );
}
