import React, { useCallback } from 'react';
import cn from 'classnames';
import { Grid, Text } from 'indigo-react';
import * as azimuth from 'azimuth-js';

import { useNetwork } from 'store/network';
import { usePointCursor } from 'store/pointCursor';
import { usePointCache } from 'store/pointCache';
import { useHistory } from 'store/history';

import * as need from 'lib/need';
import useCurrentPointName from 'lib/useCurrentPointName';
import useEthereumTransaction from 'lib/useEthereumTransaction';
import { GAS_LIMITS } from 'lib/constants';
import { ETH_ZERO_ADDR } from 'lib/wallet';
import useLifecycle from 'lib/useLifecycle';

import ViewHeader from 'components/ViewHeader';
import MiniBackButton from 'components/MiniBackButton';
import InlineEthereumTransaction from 'components/InlineEthereumTransaction';
import View from 'components/View';

function useRejectTransfer() {
  const { contracts } = useNetwork();
  const { pointCursor } = usePointCursor();
  const { syncDetails, syncControlledPoints } = usePointCache();

  const _contracts = need.contracts(contracts);
  const _point = need.point(pointCursor);

  const { construct, ...rest } = useEthereumTransaction(
    useCallback(
      () =>
        azimuth.ecliptic.setTransferProxy(_contracts, _point, ETH_ZERO_ADDR),
      [_contracts, _point]
    ),
    useCallback(
      () => Promise.all([syncDetails(_point), syncControlledPoints()]),
      [_point, syncControlledPoints, syncDetails]
    ),
    GAS_LIMITS.SET_PROXY
  );

  useLifecycle(() => {
    construct();
  });

  return {
    ...rest,
  };
}

export default function RejectTransfer() {
  const { pop } = useHistory();
  const { getDetails } = usePointCache();
  const { pointCursor } = usePointCursor();
  const _point = need.point(pointCursor);

  const name = useCurrentPointName();
  const _details = need.details(getDetails(_point));

  const { completed, bind } = useRejectTransfer();

  return (
    <View inset>
      <Grid>
        <Grid.Item full as={MiniBackButton} onClick={() => pop()} />

        <Grid.Item full as={ViewHeader}>
          Reject Incoming Transfer
        </Grid.Item>

        <Grid.Item
          full
          as={Text}
          className={cn('f5', {
            green3: completed,
          })}>
          {completed
            ? `The incoming transfer of ${name} has been rejected.`
            : `Reject the incoming transfer of ${name} from ${_details.owner}.`}
        </Grid.Item>

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
