import React, { useCallback, useMemo } from 'react';
import cn from 'classnames';
import { Grid, Text } from 'indigo-react';
import * as azimuth from 'azimuth-js';

import { useNetwork } from 'store/network';
import { usePointCursor } from 'store/pointCursor';
import { usePointCache } from 'store/pointCache';

import * as need from 'lib/need';
import useEthereumTransaction from 'lib/useEthereumTransaction';
import { GAS_LIMITS } from 'lib/constants';
import { useLocalRouter } from 'lib/LocalRouter';

import ViewHeader from 'components/ViewHeader';
import InlineEthereumTransaction from 'components/InlineEthereumTransaction';
import patp2dec from 'lib/patp2dec';
import View from 'components/View';
import useCurrentPermissions from 'lib/useCurrentPermissions';
import WarningBox from 'components/WarningBox';
import BridgeForm from 'form/BridgeForm';
import {
  PointInput,
  composeValidator,
  NumberInput,
  buildNumberValidator,
  buildPointValidator,
} from 'form/Inputs';
import FormError from 'form/FormError';

function useSetPoolSize() {
  const { contracts } = useNetwork();
  const { pointCursor } = usePointCursor();
  const { syncOwnedPoint } = usePointCache();

  const _contracts = need.contracts(contracts);
  const _point = need.point(pointCursor);

  return useEthereumTransaction(
    useCallback(
      (poolOwner, poolSize) =>
        azimuth.delegatedSending.setPoolSize(
          _contracts,
          _point,
          poolOwner,
          poolSize
        ),
      [_contracts, _point]
    ),
    useCallback(() => syncOwnedPoint(_point), [_point, syncOwnedPoint]),
    GAS_LIMITS.DEFAULT // TODO: GAS_LIMITS.SET_POOL_SIZE
  );
}

export default function PartySetPoolSize() {
  const { pop } = useLocalRouter();
  const { contracts } = useNetwork();

  const _contracts = need.contracts(contracts);

  const { spawnIsDelegatedSending } = useCurrentPermissions();

  const {
    construct,
    unconstruct,
    completed,
    inputsLocked,
    bind,
  } = useSetPoolSize();

  const validate = useMemo(
    () =>
      composeValidator({
        poolOwner: buildPointValidator(),
        poolSize: buildNumberValidator(0),
      }),
    []
  );

  const onValues = useCallback(
    ({ valid, values }) => {
      if (valid) {
        construct(patp2dec(values.poolOwner), values.poolSize);
      } else {
        unconstruct();
      }
    },
    [construct, unconstruct]
  );

  return (
    <View pop={pop} inset>
      <Grid>
        <Grid.Item full as={ViewHeader}>
          Set Pool Size
        </Grid.Item>

        {!spawnIsDelegatedSending && (
          <Grid.Item full as={WarningBox} className="mb4">
            The spawn proxy must be set to{' '}
            <code className="mono f6">
              {_contracts.delegatedSending.address}
            </code>{' '}
            for invitations to be available.
          </Grid.Item>
        )}

        <BridgeForm
          validate={validate}
          onSubmit={() => {}}
          onValues={onValues}
          initialValues={{ poolSize: 5 }}>
          {({ handleSubmit, values }) => (
            <>
              <Grid.Item
                full
                as={Text}
                className={cn('f5', {
                  green3: completed,
                })}>
                {completed
                  ? `${values.poolSize} invites have been allocated to ${values.poolOwner}`
                  : `Allocate invites to a child point.`}
              </Grid.Item>

              {!completed && (
                <>
                  <Grid.Item
                    full
                    as={PointInput}
                    className="mt4"
                    name="poolOwner"
                    label="Point"
                    disabled={inputsLocked}
                  />
                  <Grid.Item
                    full
                    as={NumberInput}
                    className="mb4"
                    name="poolSize"
                    label="Pool Size"
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
    </View>
  );
}
