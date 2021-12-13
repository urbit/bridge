import cn from 'classnames';
import { Box, Text } from '@tlon/indigo-react';
import { AddressButton } from 'components/AddressButton';
import InlineEthereumTransaction from 'components/InlineEthereumTransaction';
import BridgeForm from 'form/BridgeForm';
import { convertToNumber } from 'form/formatters';
import FormError from 'form/FormError';
import { AddressInput, NumberInput } from 'form/Inputs';
import { buildNumberValidator, composeValidator } from 'form/validators';
import { Grid, Flex } from 'indigo-react';
import { pluralize } from 'lib/pluralize';
import { useCallback, useEffect, useMemo } from 'react';
import { useStarReleaseCache } from 'store/starRelease';
import { useWithdrawStars } from './useWithdrawStars';

interface WithdrawFormProps {
  afterSubmit: VoidFunction;
}

export const WithdrawForm = ({ afterSubmit }: WithdrawFormProps) => {
  const {
    bind,
    construct,
    unconstruct,
    inputsLocked,
    completed,
    reset,
  } = useWithdrawStars();

  const { syncStarReleaseDetails, starReleaseDetails } = useStarReleaseCache();

  useEffect(() => {
    syncStarReleaseDetails();
  }, [syncStarReleaseDetails]);

  const onValues = useCallback(
    ({ valid, values }) => {
      if (valid) {
        construct(values.address, convertToNumber(values.numStars));
      } else {
        unconstruct();
      }
    },
    [construct, unconstruct]
  );

  const canWithdraw = starReleaseDetails.map(b => b.available);
  const total = starReleaseDetails.map(b => b.total);

  const validate = useMemo(
    () =>
      composeValidator(
        {
          numStars: buildNumberValidator(0, canWithdraw.getOrElse(0) + 1),
        },
        (values, errors) => (inputsLocked ? false : errors)
      ),
    [canWithdraw, inputsLocked]
  );

  const initialValues = {};

  return (
    <>
      <BridgeForm
        initialValues={initialValues}
        onValues={onValues}
        validate={validate}
        afterSubmit={afterSubmit}>
        {({ values, form }) => (
          <>
            {!completed && (
              <>
                <Box className={cn("info-row", { available: canWithdraw.value > 0})}>
                  <Text>{`${canWithdraw.value} of ${total.value} available`}</Text>
                </Box>
                <Box className="info-row">
                  <Text>{`${total.value -
                    canWithdraw.value} are in lockup`}</Text>
                </Box>
                <Grid.Item
                  cols={[1, 4]}
                  label="Stars"
                  as={NumberInput}
                  placeholder="0"
                  name="numStars"
                  disabled={inputsLocked}
                />
                <Grid.Item full className="f5" cols={[1, 13]} as={Flex} col>
                  <Flex.Item
                    name="address"
                    as={AddressInput}
                    label="Withdraw To"
                    disabled={inputsLocked}
                  />
                  <Box>
                    <AddressButton inputName="address">
                      Use my address
                    </AddressButton>
                  </Box>
                </Grid.Item>
              </>
            )}

            <Grid.Item full as={FormError} />
            {completed && (
              <>
                <Grid.Item full className="pv4">
                  {values.numStars}{' '}
                  {pluralize(values.numStars, 'star has', 'stars have')} been
                  withdrawn
                </Grid.Item>
                <Grid.Divider />
              </>
            )}
            <Grid.Item
              full
              as={InlineEthereumTransaction}
              {...bind}
              label="Withdraw Stars"
              onReturn={() => {
                reset();
                form.reset();
              }}
            />
          </>
        )}
      </BridgeForm>
    </>
  );
};
