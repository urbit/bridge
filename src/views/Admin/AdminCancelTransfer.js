import React, { useEffect } from 'react';
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
import MiniBackButton from 'components/MiniBackButton';
import InlineEthereumTransaction from 'components/InlineEthereumTransaction';

function useCancelTransfer() {
  const { contracts } = useNetwork();
  const { pointCursor } = usePointCursor();
  const { syncOwnedPoint } = usePointCache();

  const _contracts = need.contracts(contracts);
  const _point = need.point(pointCursor);

  const { construct, confirmed, bind } = useEthereumTransaction(
    GAS_LIMITS.SET_PROXY
  );

  useLifecycle(() => {
    construct(
      azimuth.ecliptic.setTransferProxy(_contracts, _point, ETH_ZERO_ADDR)
    );
  });

  // sync point details after success
  useEffect(() => {
    if (confirmed) {
      syncOwnedPoint(_point);
    }
  }, [_point, confirmed, syncOwnedPoint]);

  return {
    confirmed,
    bind,
  };
}

export default function AdminCancelTransfer() {
  const { pop } = useLocalRouter();
  const { getDetails } = usePointCache();
  const { pointCursor } = usePointCursor();
  const _point = need.point(pointCursor);

  const name = useCurrentPointName();
  const _details = need.details(getDetails(_point));

  const { confirmed, bind } = useCancelTransfer();

  return (
    <Grid>
      <Grid.Item full as={MiniBackButton} onClick={() => pop()} />

      <Grid.Item full as={ViewHeader}>
        Cancel Outgoing Transfer
      </Grid.Item>

      <Grid.Item
        full
        as={Text}
        className={cn('f5', {
          green3: confirmed,
        })}>
        {confirmed
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
