import React, { useCallback, useEffect } from 'react';
import cn from 'classnames';
import { Grid, Text, Button } from 'indigo-react';
import * as azimuth from 'azimuth-js';
import { Nothing } from 'folktale/maybe';
import { Row } from '@tlon/indigo-react';

import { useNetwork } from 'store/network';
import { usePointCursor } from 'store/pointCursor';
import { usePointCache } from 'store/pointCache';
import { useRollerStore } from 'store/rollerStore';

import * as need from 'lib/need';
import { useLocalRouter } from 'lib/LocalRouter';
import useCurrentPointName from 'lib/useCurrentPointName';
import useEthereumTransaction from 'lib/useEthereumTransaction';
import { ETH_ZERO_ADDR, GAS_LIMITS } from 'lib/constants';
import useLifecycle from 'lib/useLifecycle';
import useRoller from 'lib/useRoller';

import InlineEthereumTransaction from 'components/InlineEthereumTransaction';
import View from 'components/View';
import Window from 'components/L2/Window/Window';
import HeaderPane from 'components/L2/Window/HeaderPane';
import BodyPane from 'components/L2/Window/BodyPane';
import L2BackHeader from 'components/L2/Headers/L2BackHeader';

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

function AdminCancelTransfer() {
  const { pop } = useLocalRouter();
  const { getDetails } = usePointCache();
  const { point } = useRollerStore();
  const { setProxyAddress, checkForUpdates } = useRoller();
  const { pointCursor, setPointCursor } = usePointCursor();
  const _point = need.point(pointCursor);

  const name = useCurrentPointName();
  const _details = need.details(getDetails(_point));

  const { completed, bind } = useCancelTransfer();

  useEffect(() => {
    if (completed) {
      checkForUpdates(point.value, `${point.patp} transfer cancelled`);
    }
  }, [completed]); // eslint-disable-line react-hooks/exhaustive-deps

  const goBack = useCallback(() => {
    pop();
    setPointCursor(Nothing());
  }, [pop, setPointCursor]);

  const cancelTransfer = useCallback(async () => {
    await setProxyAddress('transfer', ETH_ZERO_ADDR);
    await checkForUpdates(point.value, `${point.patp} transfer cancelled`);
    goBack();
  }, [setProxyAddress, goBack, checkForUpdates, point]);

  const formattedName = <span className="mono">{name}</span>;
  const formattedProxy = <span className="mono">{_details.transferProxy}</span>;

  return (
    <Window>
      <HeaderPane>
        <Row className="header-row">
          <h5>Cancel Outgoing Transfer</h5>
        </Row>
      </HeaderPane>
      <BodyPane>
        <Grid.Item
          full
          as={Text}
          className={cn('f5 wrap mb5', {
            green3: completed,
          })}>
          {completed ? (
            <>The outgoing transfer of {formattedName} has been cancelled.</>
          ) : (
            <>
              Cancel the outgoing transfer of {formattedName} to{' '}
              {formattedProxy}.
            </>
          )}
        </Grid.Item>

        {point.isL2 ? (
          <Grid.Item
            as={Button}
            full
            className="set-proxy mt4 w-full"
            center
            solid
            onClick={cancelTransfer}>
            {'Cancel'}
          </Grid.Item>
        ) : (
          <Grid.Item
            full
            as={InlineEthereumTransaction}
            {...bind}
            onReturn={() => goBack()}
          />
        )}
      </BodyPane>
    </Window>
  );
}

export default function CancelTransfer() {
  const { pop } = useLocalRouter();
  const { setPointCursor } = usePointCursor();

  const goBack = useCallback(() => {
    setPointCursor(Nothing());
    pop();
  }, [pop, setPointCursor]);

  return (
    <View
      pop={pop}
      className="cancel-transfer"
      hideBack
      header={<L2BackHeader hideBalance back={goBack} />}>
      <AdminCancelTransfer />
    </View>
  );
}
