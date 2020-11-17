import React, { useCallback, useMemo } from 'react';
import cn from 'classnames';
import { Grid, Text, CheckboxInput } from 'indigo-react';
import * as azimuth from 'azimuth-js';

import { useNetwork } from 'store/network';
import { usePointCursor } from 'store/pointCursor';
import { usePointCache } from 'store/pointCache';
import { useWallet } from 'store/wallet';

import * as need from 'lib/need';
import useCurrentPointName from 'lib/useCurrentPointName';
import useEthereumTransaction from 'lib/useEthereumTransaction';
import { GAS_LIMITS } from 'lib/constants';
import useLifecycle from 'lib/useLifecycle';
import { useLocalRouter } from 'lib/LocalRouter';

import ViewHeader from 'components/ViewHeader';
import InlineEthereumTransaction from 'components/InlineEthereumTransaction';
import View from 'components/View';

import BridgeForm from 'form/BridgeForm';
import { composeValidator, buildCheckboxValidator } from 'form/validators';

function useAcceptTransfer() {
  const { contracts } = useNetwork();
  const { pointCursor } = usePointCursor();
  const { syncOwnedPoint, syncControlledPoints } = usePointCache();
  const { wallet } = useWallet();

  const _contracts = need.contracts(contracts);
  const _point = need.point(pointCursor);
  const _address = need.addressFromWallet(wallet);

  const transaction = useEthereumTransaction(
    useCallback(
      reset =>
        azimuth.ecliptic.transferPoint(_contracts, _point, _address, reset),
      [_contracts, _point, _address]
    ),
    useCallback(
      () => Promise.all([syncOwnedPoint(_point), syncControlledPoints()]),
      [_point, syncControlledPoints, syncOwnedPoint]
    ),
    GAS_LIMITS.TRANSFER
  );

  return {
    ...transaction,
  };
}

export default function AcceptTransfer() {
  const { pop } = useLocalRouter();

  const name = useCurrentPointName();

  const { completed, bind, inputsLocked, construct } = useAcceptTransfer();

  const initialValues = useMemo(() => ({ noReset: false }), []);

  const validate = useMemo(
    () => composeValidator({ noReset: buildCheckboxValidator() }),
    []
  );

  const onValues = useCallback(
    ({ valid, values, form }) => {
      construct(!values.noReset);
    },
    [construct]
  );

  return (
    <View pop={pop} inset>
      <Grid>
        <Grid.Item full as={ViewHeader}>
          Accept Transfer
        </Grid.Item>

        <Grid.Item
          full
          as={Text}
          className={cn('f5 wrap', {
            green3: completed,
          })}>
          {completed
            ? `${name} has been accepted.`
            : `Accept the incoming transfer of ${name}.`}
        </Grid.Item>

        <BridgeForm
          validate={validate}
          initialValues={initialValues}
          onValues={onValues}>
          {() => (
            <Grid.Item
              full
              as={CheckboxInput}
              name="noReset"
              label="Retain proxies and key configuration, in case of transferring to self"
              disabled={inputsLocked}
            />
          )}
        </BridgeForm>

        <Grid.Item
          full
          as={InlineEthereumTransaction}
          {...bind}
          onReturn={() => pop()}
        />
      </Grid>
    </View>
  );
}
