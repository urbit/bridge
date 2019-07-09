import React, { useState, useCallback } from 'react';
import { Just, Nothing } from 'folktale/maybe';
import * as need from 'lib/need';
import { Grid } from 'indigo-react';

import { ForwardButton } from 'components/Buttons';
import { matchBlinky } from 'components/Blinky';

import { ROUTE_NAMES } from 'lib/routeNames';
import { ETH_ZERO_ADDR } from 'lib/wallet';

import useLifecycle from 'lib/useLifecycle';
import { useNetwork } from 'store/network';
import { useHistory } from 'store/history';
import { useWallet } from 'store/wallet';
import { usePointCursor } from 'store/pointCursor';
import { usePointCache } from 'store/pointCache';
import ViewHeader from 'components/ViewHeader';
import usePermissionsForPoint from 'lib/usePermissionsForPoint';

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
  const history = useHistory();
  const { web3, contracts } = useNetwork();
  const { wallet } = useWallet();
  const { pointCursor } = usePointCursor();
  const { getDetails } = usePointCache();

  const [rekeyDate, setRekeyDate] = useState(Nothing());

  const point = need.point(pointCursor);
  const userAddress = need.wallet(wallet).address;

  const pointDetails = need.details(getDetails(point));
  const { isOwner, canManage, canSpawn, canVote } = usePermissionsForPoint(
    userAddress,
    point
  );

  useLifecycle(() => {
    getRekeyDate(need.web3(web3), need.contracts(contracts), point).then(
      res => {
        if (res === null) setRekeyDate(Just('unknown'));
        else setRekeyDate(Just(res.toString()));
      }
    );
  });

  const goSetManagement = useCallback(
    () => history.push(ROUTE_NAMES.SET_MANAGEMENT_PROXY),
    [history]
  );

  const goSetSpawn = useCallback(
    () => history.push(ROUTE_NAMES.SET_SPAWN_PROXY),
    [history]
  );

  const goSetVoting = useCallback(
    () => history.push(ROUTE_NAMES.SET_VOTING_PROXY),
    [history]
  );

  const goSetKeys = useCallback(() => history.push(ROUTE_NAMES.SET_KEYS), [
    history,
  ]);

  const proxyAction = (name, address, onClick) => {
    if (address === ETH_ZERO_ADDR) {
      address = 'Not yet set';
    }

    return (
      <Grid.Item full>
        <ForwardButton disabled={!isOwner} onClick={onClick} detail={address}>
          {`${name} Proxy Address`}
        </ForwardButton>
      </Grid.Item>
    );
  };

  const networkKeysDetail =
    pointDetails.keyRevisionNumber === 0 ? (
      'Not yet configured'
    ) : (
      <>
        {`Revision #${pointDetails.keyRevisionNumber}, since `}
        {matchBlinky(rekeyDate)}
      </>
    );

  return (
    <Grid>
      <Grid.Item full as={ViewHeader}>
        Permissions
      </Grid.Item>
      <Grid.Item full as={ForwardButton} detail={pointDetails.owner} disabled>
        Ownership Address
      </Grid.Item>
      <Grid.Divider />
      {proxyAction('Management', pointDetails.managementProxy, goSetManagement)}
      <Grid.Divider />

      {canSpawn && (
        <>
          {proxyAction('Spawn', pointDetails.spawnProxy, goSetSpawn)}
          <Grid.Divider />
        </>
      )}

      {canVote && (
        <>
          {proxyAction('Voting', pointDetails.votingProxy, goSetVoting)}
          <Grid.Divider />
        </>
      )}
      <Grid.Item
        full
        as={ForwardButton}
        disabled={!canManage}
        onClick={goSetKeys}
        detail={networkKeysDetail}>
        Network keys
      </Grid.Item>
      <Grid.Divider />
    </Grid>
  );
}
