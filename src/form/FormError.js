import React from 'react';
import { useFormState } from 'react-final-form';
import { ErrorText } from 'indigo-react';
import { FORM_ERROR } from 'final-form';

export default function FormError(props) {
  const { submitError, errors } = useFormState({
    subscription: { submitError: true, errors: true },
  });

  const formError = errors[FORM_ERROR];

  return submitError || formError ? (
    <ErrorText {...props}>{submitError || formError}</ErrorText>
  ) : null;
}
