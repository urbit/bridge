import { useEffect } from 'react';
import { useForm } from 'react-final-form';
import { map } from 'lodash';

export default function WarningEngine({ warnings }) {
  const form = useForm();

  useEffect(() => {
    map(warnings, (warning, name) =>
      form.mutators.setFieldData(name, { warning })
    );
  }, [form, warnings]);

  return null;
}
