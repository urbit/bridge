import React, { useCallback } from 'react';
import { Just, Nothing } from 'folktale/maybe';
import { Grid } from 'indigo-react';
import { azimuth } from 'azimuth-js';

import { useNetwork } from 'store/network';
import { usePointCursor } from 'store/pointCursor';
import { usePointCache } from 'store/pointCache';

import * as need from 'lib/need';
import { isZeroAddress } from 'lib/wallet';
import { PROXY_TYPE, proxyTypeToHuman } from 'lib/proxy';
import { useLocalRouter } from 'lib/LocalRouter';
import capitalize from 'lib/capitalize';
import { eqAddr } from 'lib/wallet';
import useCurrentPermissions from 'lib/useCurrentPermissions';

import ViewHeader from 'components/ViewHeader';
import { ForwardButton } from 'components/Buttons';
import { matchBlinkyDate } from 'components/Blinky';
import MiniBackButton from 'components/MiniBackButton';

export default function AdminEditPermissions() {
  const { pop, push, names } = useLocalRouter();
  const { contracts } = useNetwork();
  const { pointCursor } = usePointCursor();
  const { getDetails, getRekeyDate } = usePointCache();

  const _contracts = need.contracts(contracts);

  const point = need.point(pointCursor);
  const pointSize = azimuth.getPointSize(point);
  const isParent = pointSize !== azimuth.PointSize.Planet;
  const isSenate = pointSize === azimuth.PointSize.Galaxy;

  const details = need.details(getDetails(point));
  const networkRevision = parseInt(details.keyRevisionNumber, 10);
  const { canManage, isOwner } = useCurrentPermissions();

  const goSetProxy = useCallback(
    proxyType => push(names.SET_PROXY, { proxyType }),
    [push, names]
  );

  const goNetworkingKeys = useCallback(() => push(names.NETWORKING_KEYS), [
    push,
    names,
  ]);

  const renderProxyAction = (proxyType, address) => {
    if (isZeroAddress(address)) {
      address = 'Not set';
    } else if (eqAddr(address, _contracts.delegatedSending.address)) {
      address = `${address} (invites contract)`;
    }

    return (
      <>
        <Grid.Item full>
          <ForwardButton
            disabled={!isOwner}
            onClick={() => goSetProxy(proxyType)}
            detail={address}>
            {capitalize(proxyTypeToHuman(proxyType))} Proxy Address
          </ForwardButton>
        </Grid.Item>
        <Grid.Divider />
      </>
    );
  };

  const renderNetworkKeysDetail = () => {
    if (networkRevision === 0) {
      return 'Not yet configured.';
    }

    const renderRevision = maybeDate => (
      <>
        Revision #{networkRevision}, since {matchBlinkyDate(maybeDate)}
      </>
    );

    return getRekeyDate(point).matchWith({
      Nothing: () => renderRevision(Nothing()),
      Just: p =>
        p.value.matchWith({
          Ok: r => renderRevision(Just(r.value)),
          Error: 'Unknown',
        }),
    });
  };

  return (
    <Grid>
      <Grid.Item full as={MiniBackButton} onClick={() => pop()} />
      <Grid.Item full as={ViewHeader}>
        Permissions
      </Grid.Item>

      <Grid.Item full as={ForwardButton} detail={details.owner} disabled>
        Ownership Address
      </Grid.Item>
      <Grid.Divider />

      {renderProxyAction(PROXY_TYPE.MANAGEMENT, details.managementProxy)}

      {isParent && renderProxyAction(PROXY_TYPE.SPAWN, details.spawnProxy)}

      {isSenate && renderProxyAction(PROXY_TYPE.VOTING, details.votingProxy)}

      <Grid.Item
        full
        as={ForwardButton}
        disabled={!canManage}
        onClick={goNetworkingKeys}
        detail={renderNetworkKeysDetail()}>
        Networking Keys
      </Grid.Item>
      <Grid.Divider />
    </Grid>
  );
}
