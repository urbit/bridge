import React from 'react';
import cn from 'classnames';
import { useFormState } from 'react-final-form';

import { ForwardButton } from 'components/Buttons';

import { blinkIf } from 'components/Blinky';

export default function SubmitButton({
  as: As = ForwardButton,
  className,
  children,
  handleSubmit,
  ...rest
}) {
  const {
    valid,
    validating,
    submitting,
    hasValidationErrors,
    hasSubmitErrors,
    dirtySinceLastSubmit,
  } = useFormState();

  const canSubmit =
    (valid || (hasSubmitErrors && dirtySinceLastSubmit)) &&
    !validating &&
    !hasValidationErrors &&
    !submitting;

  return (
    <As
      className={cn('mt4', className)}
      disabled={!canSubmit}
      accessory={blinkIf(validating || submitting)}
      onClick={handleSubmit}
      solid
      {...rest}>
      {children}
    </As>
  );
}
