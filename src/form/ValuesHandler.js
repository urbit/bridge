import { useEffect } from 'react';
import { useFormState, useForm } from 'react-final-form';

/**
 * ValuesHandler notifies callback function when form values change.
 */
export default function ValuesHandler({ onValues }) {
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
      onValues && onValues({ valid, values, form });
    }
  }, [form, onValues, valid, validating, values]);

  return null;
}
