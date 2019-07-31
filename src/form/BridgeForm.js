import React from 'react';
import { Form } from 'react-final-form';
import setFieldData from 'final-form-set-field-data';

import Autosaver from './Autosaver';
import ValidationPauser from './ValidationPauser';

export default function BridgeForm({ children, onValues, ...rest }) {
  return (
    <Form mutators={{ setFieldData }} {...rest}>
      {formProps => (
        <>
          <ValidationPauser />
          {children(formProps)}
          {onValues && <Autosaver onValues={onValues} />}
        </>
      )}
    </Form>
  );
}
