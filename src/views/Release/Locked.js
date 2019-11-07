import React, { useCallback, useEffect, useMemo } from 'react';
import cn from 'classnames';
import { Grid, Flex } from 'indigo-react';

import * as need from 'lib/need';
import useEthereumTransaction from 'lib/useEthereumTransaction';
import pluralize from 'lib/pluralize';

import { useWallet } from 'store/wallet';
import { usePointCache } from 'store/pointCache';
import { useStarReleaseCache } from 'store/starRelease';

import InlineEthereumTransaction from 'components/InlineEthereumTransaction';

import { NumberInput, AddressInput } from 'form/Inputs';
import BridgeForm from 'form/BridgeForm';
import FormError from 'form/FormError';
import { composeValidator, buildNumberValidator } from 'form/validators';
import { convertToNumber } from 'form/formatters';

function AddressIndicator({ isOwn, className }) {
  return isOwn ? (
    <div className={cn('green2', className)}>✓ Current Address</div>
  ) : (
    <div className={cn('red4', className)}>! Different address</div>
  );
}

function useWithdrawStars() {
  const { syncControlledPoints } = usePointCache();

  const { syncStarReleaseDetails, withdraw } = useStarReleaseCache();
  return useEthereumTransaction(
    useCallback((to, amount) => withdraw(amount, to)),
    useCallback(
      () => Promise.all([syncControlledPoints(), syncStarReleaseDetails()]),
      [syncStarReleaseDetails, syncControlledPoints]
    )
  );
}

export default function LockedView({ className }) {
  const { wallet } = useWallet();
  const address = need.addressFromWallet(wallet);
  const { bind, construct, unconstruct, inputsLocked } = useWithdrawStars();

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

  const available = starReleaseDetails
    .map(b => b.available - b.withdrawn)
    .getOrElse(0);
  const total = starReleaseDetails.map(b => b.total).getOrElse(0);
  const withdrawn = starReleaseDetails.map(b => b.withdrawn).getOrElse(0);

  const validate = useMemo(
    () =>
      composeValidator({
        numStars: buildNumberValidator(0, available + 1),
      }),
    [available]
  );

  const initialValues = { address };

  return (
    <Grid gap={6} className={cn('mt4', className)} full>
      <BridgeForm
        initialValues={initialValues}
        onValues={onValues}
        validate={validate}>
        {({ values, reset }) => (
          <>
            <Grid.Item full className="f5">
              You have{' '}
              <span
                className={cn({
                  green2: available > 0,
                  red4: available === 0,
                })}>
                {available}
              </span>
              {pluralize(available, ' star ', ' stars ')}
              available to withdraw
              <br />
              You have <span className="green2">{total - withdrawn}</span>
              {pluralize(available, ' star ', ' stars ')}
              total
            </Grid.Item>
            <Grid.Item full className="f5" cols={[1, 10]} as={Flex} col>
              <Flex.Item
                name="address"
                as={AddressInput}
                label="Withdraw To"
                disabled={inputsLocked}
              />
              <Flex.Item
                as={AddressIndicator}
                isOwn={address === values.address}
              />
            </Grid.Item>

            <Grid.Item
              cols={[1, 5]}
              label="Stars"
              style={{ minWidth: '0' }}
              as={NumberInput}
              placeholder="#"
              name="numStars"
              disabled={inputsLocked}
            />
            <Grid.Item as={Flex} col cols={[5, 8]}>
              <Flex.Item className="f6 lh-tall">&nbsp;</Flex.Item>
              <Flex.Item className="f3">/ {available}</Flex.Item>
            </Grid.Item>
            <Grid.Item full as={FormError} />
            <Grid.Item
              full
              as={InlineEthereumTransaction}
              {...bind}
              onReturn={() => reset()}
              label="Withdraw Stars"
            />
          </>
        )}
      </BridgeForm>
    </Grid>
  );
}
