import React from 'react';
import { Form } from 'react-final-form';
import setFieldData from 'final-form-set-field-data';

import FormError from './FormError';
import Autosaver from './Autosaver';

export default function BridgeForm({ children, onValues, ...rest }) {
  return (
    <Form mutators={{ setFieldData }} {...rest}>
      {formProps => (
        <>
          {children(formProps)}
          {onValues && <Autosaver onValues={onValues} />}
          <FormError />
        </>
      )}
    </Form>
  );
}
