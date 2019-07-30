import React from 'react';
import cn from 'classnames';

import { ForwardButton } from 'components/Buttons';

import { blinkIf } from 'components/Blinky';
import { useFormState } from 'react-final-form';

export default function SubmitButton({
  as: As = ForwardButton,
  className,
  children,
  handleSubmit,
  ...rest
}) {
  const { valid, validating, submitting, submitError } = useFormState({
    subscription: {
      valid: true,
      validating: true,
      submitting: true,
      submitError: true,
    },
  });

  return (
    <As
      className={cn('mt4', className)}
      disabled={!valid || validating || submitting}
      accessory={blinkIf(validating || submitting)}
      onClick={handleSubmit}
      solid
      {...rest}>
      {submitError ? 'Error submitting' : children}
    </As>
  );
}
