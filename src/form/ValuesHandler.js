import { useEffect } from 'react';
import { useForm } from 'react-final-form';

/**
 * ValuesHandler notifies callback function when form values change.
 */
export default function ValuesHandler({ valid, validating, values, onValues }) {
  const form = useForm();
  const validationPaused = form.isValidationPaused();

  useEffect(() => {
    if (!validating && !validationPaused) {
      onValues && onValues({ valid, values, form });
    }
  }, [form, onValues, valid, validating, validationPaused, values]);

  return null;
}
