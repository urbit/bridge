import React, { useCallback } from 'react';
import cn from 'classnames';
import { Grid, Text } from 'indigo-react';
import { useLocalRouter } from 'lib/LocalRouter';
import useMakeClaim from 'lib/useMakeClaim';
import ViewHeader from 'components/ViewHeader';
import InlineEthereumTransaction from 'components/InlineEthereumTransaction';
import { PointInput } from 'form/Inputs';
import ob from 'urbit-ob';
import {
  composeValidator,
  hasErrors,
  buildPointValidator,
} from 'form/validators';
import BridgeForm from 'form/BridgeForm';
import FormError from 'form/FormError';

export default function MakeAltId() {
  const { pop } = useLocalRouter();

  const {
    isDefaultState,
    construct,
    unconstruct,
    completed,
    inputsLocked,
    bind,
  } = useMakeClaim();

  const validate = composeValidator(
    {
      point: buildPointValidator(),
    },
    (values, errors) => {
      if (hasErrors(errors)) {
        return errors;
      }
    }
  );

  const onValues = useCallback(
    ({ valid, values }) => {
      if (valid) {
        construct('alt-id', ob.patp2dec(values.point), '0x');
      } else {
        unconstruct();
      }
    },
    [construct, unconstruct]
  );

  return (
    <Grid>
      <Grid.Item full as={ViewHeader}>
        Make alt id
      </Grid.Item>

      {isDefaultState && (
        <Grid.Item full as={Text}>
          Type out your altId
        </Grid.Item>
      )}

      <BridgeForm validate={validate} onValues={onValues}>
        {({ handleSubmit, values }) => (
          <>
            {completed && (
              <Grid.Item
                full
                as={Text}
                className={cn('f5 wrap', {
                  green3: completed,
                })}>
                AltId {values.point} has been made
              </Grid.Item>
            )}

            {!completed && (
              <>
                <Grid.Item
                  full
                  as={PointInput}
                  name="point"
                  disabled={inputsLocked}
                  className="mt4"
                />
              </>
            )}

            <Grid.Item full as={FormError} />

            <Grid.Item
              full
              as={InlineEthereumTransaction}
              {...bind}
              onReturn={() => pop()}
            />
          </>
        )}
      </BridgeForm>
    </Grid>
  );
}
