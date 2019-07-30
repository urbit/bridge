import React from 'react';
import { useFormState } from 'react-final-form';
import { ErrorText } from 'indigo-react';

export default function FormError() {
  const { submitError } = useFormState({ subscription: { submitError: true } });

  return submitError ? <ErrorText>{submitError}</ErrorText> : null;
}
