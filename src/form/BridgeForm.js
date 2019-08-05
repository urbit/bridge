import React from 'react';
import { Form } from 'react-final-form';
import setFieldData from 'final-form-set-field-data';

import ValuesHandler from './ValuesHandler';
import ValidationPauser from './ValidationPauser';

export default function BridgeForm({ children, onValues, ...rest }) {
  return (
    <Form mutators={{ setFieldData }} {...rest}>
      {formProps => (
        <>
          <ValidationPauser />
          {children(formProps)}
          {onValues && <ValuesHandler onValues={onValues} />}
        </>
      )}
    </Form>
  );
}
