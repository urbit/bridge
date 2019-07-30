import { useEffect } from 'react';
import { useFormState } from 'react-final-form';

export default function Autosaver({ onValues }) {
  const { valid, validating, values } = useFormState({
    subscription: {
      valid: true,
      validating: true,
      values: true,
    },
  });

  useEffect(() => {
    if (valid && !validating) {
      onValues && onValues(values);
    }
  }, [onValues, valid, validating, values]);

  return null;
}
