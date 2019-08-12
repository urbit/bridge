import React from 'react';
import { useFormState } from 'react-final-form';
import { ErrorText } from 'indigo-react';
import { FORM_ERROR } from 'final-form';

export default function FormError(props) {
  const { submitError, errors, dirtySinceLastSubmit } = useFormState({
    subscription: {
      submitError: true,
      errors: true,
      dirtySinceLastSubmit: true,
    },
  });

  const formError = errors[FORM_ERROR];
  const showFormError = !!formError;
  const showSubmitError = !!submitError && !dirtySinceLastSubmit;

  return showSubmitError || showFormError ? (
    <ErrorText {...props}>{submitError || formError}</ErrorText>
  ) : null;
}
