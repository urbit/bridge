import { useEffect } from 'react';
import { useForm } from 'react-final-form';

/**
 * ValuesHandler notifies callback function when form values change.
 */
export default function ValuesHandler({ valid, validating, values, onValues }) {
  const form = useForm();

  useEffect(() => {
    if (!validating && !form.isValidationPaused()) {
      onValues && onValues({ valid, values, form });
    }
  }, [form, onValues, valid, validating, values]);

  return null;
}
