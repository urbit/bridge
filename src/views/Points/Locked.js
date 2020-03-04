import React, { useCallback, useMemo } from 'react';
import cn from 'classnames';
import { Grid, Flex } from 'indigo-react';
import { Just } from 'folktale/maybe';

import * as need from 'lib/need';
import useEthereumTransaction from 'lib/useEthereumTransaction';
import pluralize from 'lib/pluralize';

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
  console.log(quantity);
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

export default function Locked({ className }) {
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

  const { starReleaseDetails } = useStarReleaseCache();

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

  const canWithdraw = starReleaseDetails.map(b => b.available - b.withdrawn);

  const validate = useMemo(
    () =>
      composeValidator(
        {
          numStars: buildNumberValidator(0, canWithdraw + 1),
        },
        (values, errors) => (inputsLocked ? false : errors)
      ),
    [canWithdraw, inputsLocked]
  );

  const initialValues = { address };

  return (
    <Grid gap={completed ? 0 : 7} className={cn('mt7', className)} full>
      <BridgeForm
        initialValues={initialValues}
        onValues={onValues}
        validate={validate}>
        {({ values, form }) => (
          <>
            {!completed && (
              <>
                <Grid.Item full as={Flex} col>
                  <Flex.Item full className="mb2 gray4">
                    Locked
                  </Flex.Item>
                  <Flex.Item full>
                    <MatchPluralizeStars quantity={canWithdraw} />
                  </Flex.Item>
                </Grid.Item>

                {/* <Grid.Item full className="f5"> */}
                {/*   You have <MatchPluralizeStars quantity={canWithdraw} /> */}
                {/*   available to withdraw */}
                {/*   <br /> */}
                {/*   You have */}
                {/*   <MatchPluralizeStars quantity={total} /> */}
                {/*   total */}
                {/* </Grid.Item> */}
                <Grid.Item
                  full
                  label="Stars"
                  as={NumberInput}
                  placeholder="Enter star amount"
                  name="numStars"
                  disabled={inputsLocked}
                  accessoryWidth="162px"
                  accessory={
                    <Flex
                      align="center"
                      justify="center"
                      style={{
                        'box-sizing': 'border-box',
                        height: '46px',
                        'margin-top': '1px',
                      }}
                      className="w11 bl1 b-gray2 bg-gray1">
                      stars
                    </Flex>
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
