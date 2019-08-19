import React, { useCallback } from 'react';
import cn from 'classnames';
import { Grid, Text } from 'indigo-react';
import * as azimuth from 'azimuth-js';

import { useNetwork } from 'store/network';
import { usePointCursor } from 'store/pointCursor';
import { usePointCache } from 'store/pointCache';

import * as need from 'lib/need';
import { useLocalRouter } from 'lib/LocalRouter';
import useCurrentPointName from 'lib/useCurrentPointName';
import useEthereumTransaction from 'lib/useEthereumTransaction';
import { GAS_LIMITS } from 'lib/constants';
import { ETH_ZERO_ADDR } from 'lib/wallet';
import useLifecycle from 'lib/useLifecycle';

import ViewHeader from 'components/ViewHeader';
import InlineEthereumTransaction from 'components/InlineEthereumTransaction';

function useCancelTransfer() {
  const { contracts } = useNetwork();
  const { pointCursor } = usePointCursor();
  const { syncDetails } = usePointCache();

  const _contracts = need.contracts(contracts);
  const _point = need.point(pointCursor);

  const { construct, ...rest } = useEthereumTransaction(
    useCallback(
      () =>
        azimuth.ecliptic.setTransferProxy(_contracts, _point, ETH_ZERO_ADDR),
      [_contracts, _point]
    ),
    useCallback(() => syncDetails(_point), [_point, syncDetails]),
    GAS_LIMITS.SET_PROXY
  );

  useLifecycle(() => {
    construct();
  });

  return {
    ...rest,
  };
}

export default function AdminCancelTransfer() {
  const { pop } = useLocalRouter();
  const { getDetails } = usePointCache();
  const { pointCursor } = usePointCursor();
  const _point = need.point(pointCursor);

  const name = useCurrentPointName();
  const _details = need.details(getDetails(_point));

  const { completed, bind } = useCancelTransfer();

  return (
    <Grid>
      <Grid.Item full as={ViewHeader}>
        Cancel Outgoing Transfer
      </Grid.Item>

      <Grid.Item
        full
        as={Text}
        className={cn('f5 wrap', {
          green3: completed,
        })}>
        {completed
          ? `The outgoing transfer of ${name} has been cancelled.`
          : `Cancel the outgoing transfer of ${name} to ${_details.transferProxy}.`}
      </Grid.Item>

      <Grid.Item
        full
        as={InlineEthereumTransaction}
        {...bind}
        onReturn={() => pop()}
      />
    </Grid>
  );
}
