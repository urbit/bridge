import React, { useCallback, useEffect } from 'react';
import cn from 'classnames';
import { Grid, Text, Input } from 'indigo-react';
import * as azimuth from 'azimuth-js';

import { useNetwork } from 'store/network';
import { usePointCursor } from 'store/pointCursor';
import { usePointCache } from 'store/pointCache';

import * as need from 'lib/need';
import { usePointInput, useNumberInput } from 'lib/useInputs';
import useEthereumTransaction from 'lib/useEthereumTransaction';
import { GAS_LIMITS } from 'lib/constants';

import ViewHeader from 'components/ViewHeader';
import MiniBackButton from 'components/MiniBackButton';
import InlineEthereumTransaction from 'components/InlineEthereumTransaction';
import patp2dec from 'lib/patp2dec';
import { useHistory } from 'store/history';
import View from 'components/View';
import useCurrentPermissions from 'lib/useCurrentPermissions';
import WarningBox from 'components/WarningBox';

function useSetPoolSize() {
  const { contracts } = useNetwork();
  const { pointCursor } = usePointCursor();
  const { syncOwnedPoint } = usePointCache();

  const _contracts = need.contracts(contracts);
  const _point = need.point(pointCursor);

  const {
    construct: _construct,
    unconstruct,
    confirmed,
    inputsLocked,
    bind,
  } = useEthereumTransaction(GAS_LIMITS.DEFAULT);
  // TODO: GAS_LIMITS.SET_POOL_SIZE

  const construct = useCallback(
    (poolOwner, poolSize) =>
      _construct(
        azimuth.delegatedSending.setPoolSize(
          _contracts,
          _point,
          poolOwner,
          poolSize
        )
      ),
    [_construct, _contracts, _point]
  );

  // sync point details after success
  useEffect(() => {
    if (confirmed) {
      syncOwnedPoint(_point);
    }
  }, [_point, confirmed, syncOwnedPoint]);

  return {
    construct,
    unconstruct,
    confirmed,
    inputsLocked,
    bind,
  };
}

export default function PartySetPoolSize() {
  const { pop } = useHistory();
  const { contracts } = useNetwork();

  const _contracts = need.contracts(contracts);

  const { spawnIsDelegatedSending } = useCurrentPermissions();

  const {
    construct,
    unconstruct,
    confirmed,
    inputsLocked,
    bind,
  } = useSetPoolSize();

  const [poolOwnerInput, { pass: validPoint, data: poolOwner }] = usePointInput(
    {
      name: 'point',
      label: 'Point',
      disabled: inputsLocked,
    }
  );

  const [
    poolSizeInput,
    { pass: validPoolSize, data: poolSize },
  ] = useNumberInput({
    name: 'poolsize',
    label: 'Pool Size',
    initialValue: 5,
    disabled: inputsLocked,
  });

  useEffect(() => {
    if (validPoint && validPoolSize) {
      construct(patp2dec(poolOwner), poolSize);
    } else {
      unconstruct();
    }
  }, [poolOwner, construct, validPoint, validPoolSize, poolSize, unconstruct]);

  return (
    <View inset>
      <Grid>
        <Grid.Item full as={MiniBackButton} onClick={() => pop()} />
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
        <Grid.Item
          full
          as={Text}
          className={cn('f5', {
            green3: confirmed,
          })}>
          {confirmed
            ? `${poolSize} invites have been allocated to ${poolOwner}`
            : `Allocate invites to a child point.`}
        </Grid.Item>

        {!confirmed && (
          <>
            <Grid.Item full as={Input} {...poolOwnerInput} className="mt4" />
            <Grid.Item full as={Input} {...poolSizeInput} className="mb4" />
          </>
        )}

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
