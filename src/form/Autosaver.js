import { useEffect } from 'react';
import { useFormState, useForm } from 'react-final-form';

export default function Autosaver({ onValues }) {
  const form = useForm();
  const { valid, validating, values } = useFormState({
    subscription: {
      valid: true,
      validating: true,
      values: true,
    },
  });

  useEffect(() => {
    if (!validating) {
      onValues && onValues({ valid: valid && !validating, values, form });
    }
  }, [form, onValues, valid, validating, values]);

  return null;
}
