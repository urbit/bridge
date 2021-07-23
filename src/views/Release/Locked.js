import React, { useCallback, useEffect, useMemo } from 'react';
import cn from 'classnames';
import { Grid, Flex } from 'indigo-react';
import { Just } from 'folktale/maybe';

import * as need from 'lib/need';
import useEthereumTransaction from 'lib/useEthereumTransaction';
import { pluralize } from 'lib/pluralize';

import { useWallet } from 'store/wallet';
import { usePointCache } from 'store/pointCache';
import { useStarReleaseCache } from 'store/starRelease';

import InlineEthereumTransaction from 'components/InlineEthereumTransaction';
import { matchBlinky } from 'components/Blinky';

import { NumberInput, AddressInput } from 'form/Inputs';
import BridgeForm from 'form/BridgeForm';
import FormError from 'form/FormError';
import { composeValidator, buildNumberValidator } from 'form/validators';
import { convertToNumber } from 'form/formatters';

function MatchPluralizeStars({ quantity }) {
  const _quantity = quantity.getOrElse(0);
  return (
    <>
      {' '}
      <span
        className={cn({
          green2: _quantity > 0,
          red4: Just.hasInstance(quantity) && _quantity === 0,
        })}>
        {matchBlinky(quantity)}
      </span>
      {pluralize(_quantity, ' star ', ' stars ')}
    </>
  );
}

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
    useCallback((to, amount) => withdraw(amount, to), [withdraw]),
    useCallback(
      () => Promise.all([syncControlledPoints(), syncStarReleaseDetails()]),
      [syncStarReleaseDetails, syncControlledPoints]
    )
  );
}

export default function Locked({ className, goActive }) {
  const { wallet } = useWallet();
  const address = need.addressFromWallet(wallet);
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

  const initialValues = { address };

  return (
    <Grid gap={completed ? 0 : 6} className={cn('mt4', className)} full>
      <BridgeForm
        initialValues={initialValues}
        onValues={onValues}
        validate={validate}>
        {({ values, form }) => (
          <>
            {!completed && (
              <>
                <Grid.Item full className="f5">
                  You have <MatchPluralizeStars quantity={canWithdraw} />
                  available to withdraw
                  <br />
                  You have
                  <MatchPluralizeStars quantity={total} />
                  total
                </Grid.Item>
                <Grid.Item
                  cols={[1, 4]}
                  label="Stars"
                  as={NumberInput}
                  placeholder="#"
                  name="numStars"
                  disabled={inputsLocked}
                  accessory={
                    <div className="flex-center h-full">
                      / &nbsp;{matchBlinky(canWithdraw)}
                    </div>
                  }
                />
                <Grid.Item full className="f5" cols={[1, 13]} as={Flex} col>
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
    </Grid>
  );
}
