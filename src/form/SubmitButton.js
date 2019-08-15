import React from 'react';
import cn from 'classnames';
import { useFormState } from 'react-final-form';

import { ForwardButton } from 'components/Buttons';

import { blinkIf } from 'components/Blinky';
import { onlyHasWarning } from './helpers';

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
    submitErrors,
    submitSucceeded,
  } = useFormState();

  const onlyWarningInSubmitErrors = onlyHasWarning(submitErrors);

  // can submit if:
  // 1) is valid
  //      OR has submit errors
  //      AND
  //        a) is dirty
  //        b) OR only has a warning (double conf)
  // 2) AND is not validating
  // 3) AND has no validation errors
  // 4) AND is not actively submitting
  // 5) AND submit has not yet succeeded
  const canSubmit =
    (valid ||
      (hasSubmitErrors &&
        (dirtySinceLastSubmit || onlyWarningInSubmitErrors))) &&
    !validating &&
    !hasValidationErrors &&
    !submitting &&
    !submitSucceeded;

  // show the warning action text if
  // 1) we have that warning at all
  // 2) we can submit or are submitting
  const showWarningSubmitText =
    onlyWarningInSubmitErrors &&
    !dirtySinceLastSubmit &&
    (canSubmit || submitting);

  return (
    <As
      className={cn('mt4', className)}
      disabled={!canSubmit}
      accessory={blinkIf(validating || submitting)}
      onClick={handleSubmit}
      solid
      {...rest}>
      {typeof children === 'function'
        ? children(showWarningSubmitText)
        : children}
    </As>
  );
}
