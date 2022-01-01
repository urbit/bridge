import React, { useCallback } from 'react';
import { Form, FormRenderProps } from 'react-final-form';
import arrayMutators from 'final-form-arrays';
import { noop } from 'lodash';

import ValuesHandler from './ValuesHandler';
import ValidationPauser from './ValidationPauser';
import { CSSProperties } from 'styled-components';
import { FormState } from 'final-form';

/**
 * BridgeForm adds nice-to-haves for every form in bridge.
 * + afterSubmit callback for redirects
 * + default onSubmit to noop so react-final-form doesn't throw
 * + pauses validation when the form is unmounted
 * + `onValues` handler for reactive changes
 * + automatically includes array and field data mutators
 */
interface BridgeFormProps {
  // children: React.ReactNode;
  children?: any;
  // onValues?: (values: { [k: string]: string }, valid: boolean, form: any) => void | typeof noop;
  onValues?: any;
  // onSubmit?: (values: { [k: string]: string }) => void | typeof noop;
  onSubmit?: any;
  validate?: any;
  initialValues?: any;
  style?: any;
  className?: string;
  afterSubmit?: VoidFunction;
  rest?: React.HTMLProps<HTMLFormElement>;
}

export default function BridgeForm({
  children,
  onValues,
  onSubmit = noop,
  afterSubmit = noop,
  ...rest
}: BridgeFormProps) {
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
    <Form mutators={{ ...arrayMutators }} onSubmit={_onSubmit} {...rest}>
      {(
        formProps: FormRenderProps<any, Partial<any>> & {
          style: CSSProperties;
        } & FormState<any>
      ) => (
        <form
          style={formProps?.style || { display: 'contents' }}
          onSubmit={formProps.handleSubmit}>
          <ValidationPauser />
          {children(formProps)}
          {onValues && <ValuesHandler {...formProps} onValues={onValues} />}
        </form>
      )}
    </Form>
  );
}
