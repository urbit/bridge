import React, { useCallback } from 'react';
import cn from 'classnames';
import { Grid, Text } from 'indigo-react';
import { useLocalRouter } from 'lib/LocalRouter';
import useMakeClaim from 'lib/useMakeClaim';
import ViewHeader from 'components/ViewHeader';
import InlineEthereumTransaction from 'components/InlineEthereumTransaction';
import { HexInput, TextInput } from 'form/Inputs';
import {
  composeValidator,
  hasErrors,
  buildBytesValidator,
} from 'form/validators';
import BridgeForm from 'form/BridgeForm';
import FormError from 'form/FormError';

export default function MakeClaim() {
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
      protocol: () => {},
      claim: () => {},
      dossier: buildBytesValidator(),
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
        construct(
          values.protocol || '',
          values.claim || '',
          values.dossier || '0x'
        );
      } else {
        unconstruct();
      }
    },
    [construct, unconstruct]
  );

  return (
    <Grid>
      <Grid.Item full as={ViewHeader}>
        Make claim
      </Grid.Item>

      {isDefaultState && (
        <Grid.Item full as={Text}>
          Type out your claim
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
                Claim {values.claim} has been made with {values.protocol} and
                dossier: {values.dossier || '0x'}
              </Grid.Item>
            )}

            {!completed && (
              <>
                <Grid.Item
                  full
                  as={TextInput}
                  name="protocol"
                  placeholder="protocol"
                  disabled={inputsLocked}
                  label="Protocol"
                  className="mt4"
                />
                <Grid.Item
                  full
                  as={TextInput}
                  className="mb4"
                  name="claim"
                  placeholder="claim"
                  label="Claim"
                  disabled={inputsLocked}
                />
                <Grid.Item
                  full
                  as={HexInput}
                  className="mb4"
                  name="dossier"
                  placeholder="0xdossier"
                  label="Dossier"
                  disabled={inputsLocked}
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
