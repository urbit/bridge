import React, { useCallback, useEffect, useMemo } from 'react';
import { Grid } from 'indigo-react';
import * as ob from 'urbit-ob';
import { ecliptic } from 'azimuth-js';

import { useNetwork } from 'store/network';
import { usePointCache } from 'store/pointCache';
import { usePointCursor } from 'store/pointCursor';
import { useHistory } from 'store/history';

import * as need from 'lib/need';
import { GAS_LIMITS } from 'lib/constants';
import useEthereumTransaction from 'lib/useEthereumTransaction';

import InlineEthereumTransaction from 'components/InlineEthereumTransaction';
import Window from 'components/L2/Window/Window';
import HeaderPane from 'components/L2/Window/HeaderPane';
import BodyPane from 'components/L2/Window/BodyPane';
import View from 'components/View';
import L2BackHeader from 'components/L2/Headers/L2BackHeader';
import { Row } from '@tlon/indigo-react';

function useAdopt() {
  const { contracts }: any = useNetwork();
  const _contracts = need.contracts(contracts);

  const { pointCursor }: any = usePointCursor();
  const point = need.point(pointCursor);

  const { syncResidents }: any = usePointCache();

  return useEthereumTransaction(
    useCallback(
      (adoptee: number, denied: boolean) =>
        denied
          ? ecliptic.reject(_contracts, adoptee)
          : ecliptic.adopt(_contracts, adoptee),
      [_contracts]
    ),
    useCallback(() => syncResidents(point), [syncResidents, point]),
    GAS_LIMITS.DEFAULT
  );
}

export default function Adopt() {
  const { pop, data }: any = useHistory();

  const { adoptee, denied } = data;

  const patp = useMemo(() => ob.patp(adoptee), [adoptee]);

  const { construct, bind, completed } = useAdopt();

  const body = useMemo(
    () =>
      denied ? (
        <>
          {completed ? 'Rejected' : 'Rejecting'} adoption request for{' '}
          <span className="mono">{patp}</span>
        </>
      ) : (
        <>
          {completed ? 'Approved' : 'Approving'} adoption request for{' '}
          <span className="mono">{patp}</span>
        </>
      ),
    [patp, denied, completed]
  );

  useEffect(() => {
    construct(adoptee, denied);
  }, [construct, adoptee, denied]);

  const headerText = `${denied ? 'Reject' : 'Approve'} Adoption Request`;

  return (
    <View
      className="adopt-l1"
      pop={pop}
      inset
      hideBack
      header={<L2BackHeader hideBalance back={pop} />}>
      <Window>
        <HeaderPane>
          <Row className="header-row">
            <h5>{headerText}</h5>
          </Row>
        </HeaderPane>
        <BodyPane>
          <Grid.Item className="f5 mv2 w-full" style={{ fontSize: 14 }}>
            {body}
          </Grid.Item>
          <Grid.Item
            full
            {...bind}
            as={InlineEthereumTransaction}
            onReturn={() => pop()}
          />
        </BodyPane>
      </Window>
    </View>
  );
}
