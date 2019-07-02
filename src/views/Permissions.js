import React, { useState, useCallback } from 'react';
import { Just, Nothing } from 'folktale/maybe';
import * as need from 'lib/need';
import { azimuth } from 'azimuth-js';
import { Grid } from 'indigo-react';

import { P } from 'indigo-react';
import View from 'components/View';
import { ForwardButton } from 'components/Buttons';
import FooterButton from 'components/FooterButton';
import Blinky, {
  LOADING_CHARACTER,
  INTERSTITIAL_CHARACTER,
} from 'components/Blinky';

import { ROUTE_NAMES } from 'lib/routeNames';
import { eqAddr } from 'lib/wallet';

import useLifecycle from 'lib/useLifecycle';
import { useNetwork } from 'store/network';
import { useHistory } from 'store/history';
import { useWallet } from 'store/wallet';
import { usePointCursor } from 'store/pointCursor';
import { usePointCache } from 'store/pointCache';

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

export default function Permissions() {
  const history = useHistory();
  const { web3, contracts } = useNetwork();
  const { wallet } = useWallet();
  const { pointCursor } = usePointCursor();
  const { pointCache } = usePointCache();

  const [rekeyDate, setRekeyDate] = useState(Nothing());

  const point = need.point(pointCursor);
  const pointSize = azimuth.getPointSize(point);
  const userAddress = need.wallet(wallet).address;

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

  const pointDetails = need.fromPointCache(pointCache, point);

  const isOwner = eqAddr(userAddress, pointDetails.owner);
  const canManage =
    isOwner || eqAddr(userAddress, pointDetails.managementProxy);

  const proxyAction = (name, address, onClick) => {
    if (address === '0x0000000000000000000000000000000000000000')
      address = 'Unset';
    return (
      <Grid.Item full>
        <ForwardButton disabled={!isOwner} onClick={onClick} detail={address}>
          {`${name} proxy address`}
        </ForwardButton>
      </Grid.Item>
    );
  };

  let items = 3;

  let spawnProxyAction = null;
  if (pointSize !== azimuth.PointSize.Planet) {
    items++;
    spawnProxyAction = proxyAction(
      'Spawn',
      pointDetails.spawnProxy,
      goSetSpawn
    );
  }

  let votingProxyAction = null;
  if (pointSize === azimuth.PointSize.Galaxy) {
    items++;
    votingProxyAction = proxyAction(
      'Voting',
      pointDetails.votingProxy,
      goSetVoting
    );
  }

  const netKeysText =
    pointDetails.keyRevisionNumber === 0 ? (
      'Not yet configured'
    ) : (
      <>
        {`Revision #${pointDetails.keyRevisionNumber}, since `}
        {Just.hasInstance(rekeyDate) ? (
          rekeyDate.value
        ) : (
          <Blinky a={LOADING_CHARACTER} b={INTERSTITIAL_CHARACTER} delayed />
        )}
      </>
    );

  return (
    <View>
      <Grid className={`pt${items}`}>
        <Grid.Item full>
          <ForwardButton disabled="true" detail={pointDetails.owner}>
            Ownership address
          </ForwardButton>
        </Grid.Item>
        {proxyAction(
          'Management',
          pointDetails.managementProxy,
          goSetManagement
        )}
        {spawnProxyAction}
        {votingProxyAction}
        <Grid.Item full>
          <ForwardButton
            disabled={!canManage}
            onClick={goSetKeys}
            detail={netKeysText}>
            Network keys
          </ForwardButton>
        </Grid.Item>
      </Grid>

      <FooterButton detail="Transfer this identity to a new owner" disabled>
        Transfer
      </FooterButton>
    </View>
  );
}
