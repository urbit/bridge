import React, { useCallback, useEffect, useMemo } from 'react';
import { Grid } from 'indigo-react';
import * as ob from 'urbit-ob';
import { ecliptic } from 'azimuth-js';

import View from 'components/View';
import InlineEthereumTransaction from 'components/InlineEthereumTransaction';
import ViewHeader from 'components/ViewHeader';

import { useNetwork } from 'store/network';
import { usePointCache } from 'store/pointCache';
import { usePointCursor } from 'store/pointCursor';
import { useHistory } from 'store/history';

import { GAS_LIMITS } from 'lib/constants';
import useEthereumTransaction from 'lib/useEthereumTransaction';
import * as need from 'lib/need';

function useAdopt() {
  const { contracts } = useNetwork();
  const _contracts = need.contracts(contracts);

  const { pointCursor } = usePointCursor();
  const point = need.point(pointCursor);

  const { syncResidents } = usePointCache();

  return useEthereumTransaction(
    useCallback(
      (adoptee, denied) =>
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
  const { pop, data } = useHistory();

  const { adoptee, denied } = data;

  const patp = useMemo(() => ob.patp(adoptee), [adoptee]);

  // const header = //useMemo(() => denied ? 'A Request' : 'Accept Request', [denied]);
  const { construct, bind, completed } = useAdopt();

  const body = useMemo(
    () =>
      denied ? (
        <>
          {completed ? 'Denied' : 'Denying'} adoption request to{' '}
          <span className="mono">{patp}</span>
        </>
      ) : (
        <>
          {completed ? 'Approved' : 'Approving'} adoption request to{' '}
          <span className="mono">{patp}</span>
        </>
      ),
    [patp, denied, completed]
  );

  useEffect(() => {
    construct(adoptee, denied);
  }, [construct, adoptee, denied]);

  return (
    <View pop={() => pop()} inset>
      <Grid>
        <Grid.Item full as={ViewHeader} className="mb2">
          Adopt
        </Grid.Item>
        <Grid.Item full className="gray4 f5 mv2">
          {body}
        </Grid.Item>
        <Grid.Item
          full
          {...bind}
          as={InlineEthereumTransaction}
          onReturn={() => pop()}
        />
      </Grid>
    </View>
  );
}
