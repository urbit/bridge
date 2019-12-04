import React from 'react';
import { useFormState } from 'react-final-form';
import { ErrorText } from 'indigo-react-local';

import { WARNING } from './helpers';

export default function FormError(props) {
  const {
    submitError,
    submitErrors,
    error: validationError,
    dirtySinceLastSubmit,
  } = useFormState({
    subscription: {
      submitError: true,
      submitErrors: true,
      error: true,
      dirtySinceLastSubmit: true,
    },
  });

  const showValidationError = !!validationError;

  const showSubmitError = !!submitError && !dirtySinceLastSubmit;

  const warning = submitErrors && submitErrors[WARNING];
  const showWarning = !!warning && !dirtySinceLastSubmit;

  return showSubmitError || showValidationError || showWarning ? (
    <ErrorText {...props}>
      {submitError || validationError || warning}
    </ErrorText>
  ) : null;
}
