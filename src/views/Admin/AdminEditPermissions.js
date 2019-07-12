import React, { useState, useCallback } from 'react';
import { Just, Nothing } from 'folktale/maybe';
import * as need from 'lib/need';
import { Grid } from 'indigo-react';

import { ForwardButton } from 'components/Buttons';
import { matchBlinky, matchBlinkyDate } from 'components/Blinky';

import { ETH_ZERO_ADDR } from 'lib/wallet';

import useLifecycle from 'lib/useLifecycle';
import { useNetwork } from 'store/network';
import { useWallet } from 'store/wallet';
import { usePointCursor } from 'store/pointCursor';
import { usePointCache } from 'store/pointCache';
import ViewHeader from 'components/ViewHeader';
import usePermissionsForPoint from 'lib/usePermissionsForPoint';
import { PROXY_TYPE, proxyTypeToHuman } from 'lib/proxy';
import { useLocalRouter } from 'lib/LocalRouter';
import { formatDots } from 'lib/dateFormat';
import capitalize from 'lib/capitalize';

//TODO consolidate with azimuth-js' getActivationBlock
const getRekeyDate = async (web3, contracts, point) => {
  const logs = await contracts.azimuth.getPastEvents('ChangedKeys', {
    fromBlock: 0,
    toBlock: 'latest',
    filter: { point: [point] },
  });
  if (logs.length === 0) {
    return null;
  } else {
    // last log is most recent
    const block = await web3.eth.getBlock(logs[logs.length - 1].blockNumber);
    return new Date(block.timestamp * 1000);
  }
};

export default function AdminEditPermissions() {
  const { push, names } = useLocalRouter();
  const { web3, contracts } = useNetwork();
  const { wallet } = useWallet();
  const { pointCursor } = usePointCursor();
  const { getDetails } = usePointCache();

  const [rekeyDate, setRekeyDate] = useState(Nothing());

  const point = need.point(pointCursor);
  const userAddress = need.wallet(wallet).address;

  const details = need.details(getDetails(point));
  const { canManage, canSpawn, canVote } = usePermissionsForPoint(
    userAddress,
    point
  );

  useLifecycle(() => {
    getRekeyDate(need.web3(web3), need.contracts(contracts), point).then(
      res => {
        if (res === null) setRekeyDate(Just(new Date()));
        else setRekeyDate(Just(res));
      }
    );
  });

  const goToProxy = useCallback(
    proxyType => push(names.SET_PROXY, { proxyType }),
    [push, names]
  );

  const goSetKeys = useCallback(() => push(names.SET_KEYS), [push, names]);

  const proxyAction = (proxyType, address, enabled) => {
    if (address === ETH_ZERO_ADDR) {
      address = 'Not yet set';
    }

    const detail = enabled
      ? address
      : `You do not have permission to change the ${proxyTypeToHuman(
          proxyType
        )} proxy.`;

    return (
      <Grid.Item full>
        <ForwardButton
          disabled={!enabled}
          onClick={() => goToProxy(proxyType)}
          detail={detail}>
          {capitalize(proxyTypeToHuman(proxyType))} Proxy Address
        </ForwardButton>
      </Grid.Item>
    );
  };

  const networkKeysDetail =
    details.keyRevisionNumber === 0 ? (
      'Not yet configured'
    ) : (
      <>
        Revision #{details.keyRevisionNumber}, since{' '}
        {matchBlinkyDate(rekeyDate)}
      </>
    );

  return (
    <Grid>
      <Grid.Item full as={ViewHeader}>
        Permissions
      </Grid.Item>

      <Grid.Item full as={ForwardButton} detail={details.owner} disabled>
        Ownership Address
      </Grid.Item>
      <Grid.Divider />

      {proxyAction(PROXY_TYPE.MANAGEMENT, details.managementProxy, canManage)}
      <Grid.Divider />

      {proxyAction(PROXY_TYPE.SPAWN, details.spawnProxy, canSpawn)}
      <Grid.Divider />

      {proxyAction(PROXY_TYPE.VOTING, details.votingProxy, canVote)}
      <Grid.Divider />

      <Grid.Item
        full
        as={ForwardButton}
        disabled={!canManage}
        onClick={goSetKeys}
        detail={networkKeysDetail}>
        Network Keys
      </Grid.Item>
      <Grid.Divider />
    </Grid>
  );
}
