import React, { useCallback } from 'react';
import { Form } from 'react-final-form';
import setFieldData from 'final-form-set-field-data';
import arrayMutators from 'final-form-arrays';
import { noop } from 'lodash';

import ValuesHandler from './ValuesHandler';
import ValidationPauser from './ValidationPauser';
import WarningEngine from './WarningEngine';

/**
 * BridgeForm adds nice-to-haves for every form in bridge.
 * + afterSubmit callback for redirects
 * + default onSubmit to noop so react-final-form doesn't throw
 * + pauses validation when the form is unmounted
 * + `onValues` handler for reactive changes
 * + automatically includes array and field data mutators
 */
export default function BridgeForm({
  children,
  onValues,
  onSubmit = noop,
  afterSubmit = noop,
  warnings,
  ...rest
}) {
  const _onSubmit = useCallback(
    async (...args) => {
      const errors = await onSubmit(...args);
      if (errors) {
        return errors;
      }

      afterSubmit();
    },
    [afterSubmit, onSubmit]
  );

  return (
    <Form
      mutators={{ setFieldData, ...arrayMutators }}
      onSubmit={_onSubmit}
      {...rest}>
      {formProps => (
        <>
          {warnings && <WarningEngine warnings={warnings} />}
          <ValidationPauser />
          {children(formProps)}
          {onValues && <ValuesHandler onValues={onValues} />}
        </>
      )}
    </Form>
  );
}
