import React from 'react';
import { azimuth } from 'azimuth-js';
import * as need from '../../lib/need';

import { CURVE_ZERO_ADDR, isZeroAddress, eqAddr } from '../../lib/wallet';
import { H2, P } from '../../components/old/Base';
import { Button } from '../../components/old/Base';
import { ROUTE_NAMES } from '../../lib/routeNames';
import { useHistory } from '../../store/history';
import { useWallet } from '../../store/wallet';
import { Grid } from 'indigo-react';
import { usePointCursor } from 'store/pointCursor';
import { usePointCache } from 'store/pointCache';

const isPlanet = point =>
  azimuth.getPointSize(point) === azimuth.PointSize.Planet;

function Actions() {
  const history = useHistory();
  const { wallet } = useWallet();
  const { pointCursor } = usePointCursor();
  const point = need.point(pointCursor);
  const { getDetails } = usePointCache();
  const pointDetails = getDetails(point);

  const addr = need.addressFromWallet(wallet);

  const planet = isPlanet(point);

  const isOwner = pointDetails.matchWith({
    Nothing: _ => false,
    Just: details => eqAddr(details.value.owner, addr),
  });
  const isActive = pointDetails.matchWith({
    Nothing: _ => false,
    Just: details => details.value.active,
  });
  const isActiveOwner = isOwner && isActive;
  const canSetSpawnProxy = isActiveOwner && !planet;
  const canSetManagementProxy = isActiveOwner;

  const canManage =
    isOwner ||
    pointDetails.matchWith({
      Nothing: _ => false,
      Just: details => eqAddr(details.value.managementProxy, addr),
    });
  const canConfigureKeys = canManage && isActive;

  const canIssueChild = pointDetails.matchWith({
    Nothing: () => false,
    Just: details => {
      const hasPermission = isOwner || eqAddr(details.value.spawnProxy, addr);

      const isBooted = details.value.keyRevisionNumber > 0;

      const isNotPlanet = !isPlanet(point);

      return hasPermission && isBooted && isNotPlanet;
    },
  });

  const canTransfer = pointDetails.matchWith({
    Nothing: () => false,
    Just: deets =>
      eqAddr(deets.value.transferProxy, addr) ||
      eqAddr(deets.value.owner, addr),
  });

  const canAcceptTransfer = pointDetails.matchWith({
    Nothing: () => false,
    Just: deets => eqAddr(deets.value.transferProxy, addr),
  });

  const canCancelTransfer = pointDetails.matchWith({
    Nothing: () => false,
    Just: deets =>
      eqAddr(deets.value.owner, addr) &&
      !isZeroAddress(deets.value.transferProxy),
  });

  const displayReminder = pointDetails.matchWith({
    Nothing: () => false,
    Just: deets => {
      return (
        deets.value.encryptionKey === CURVE_ZERO_ADDR &&
        deets.value.authenticationKey === CURVE_ZERO_ADDR
      );
    },
  });

  return (
    <div>
      <H2>{'Actions'}</H2>
      {displayReminder ? (
        <P>{`Before you can issue child points or generate your Arvo
                  keyfile, you need to set your public keys.`}</P>
      ) : (
        ''
      )}
      <Grid>
        <Grid.Item third={1}>
          <Button
            prop-size={'sm'}
            prop-type={'link'}
            disabled={planet && !canIssueChild}
            onClick={() => {
              history.push(ROUTE_NAMES.ISSUE_CHILD);
            }}>
            {'Issue child'}
          </Button>

          <Button
            prop-size={'sm'}
            prop-type={'link'}
            disabled={!canAcceptTransfer}
            onClick={() => {
              history.push(ROUTE_NAMES.ACCEPT_TRANSFER);
            }}>
            {'Accept incoming transfer'}
          </Button>

          <Button
            prop-size={'sm'}
            prop-type={'link'}
            disabled={!canCancelTransfer}
            onClick={() => {
              history.push(ROUTE_NAMES.CANCEL_TRANSFER);
            }}>
            {'Cancel outgoing transfer'}
          </Button>
        </Grid.Item>
        <Grid.Item third={2}>
          <Button
            disabled={!canSetSpawnProxy}
            prop-size={'sm'}
            prop-type={'link'}
            onClick={() => {
              history.push(ROUTE_NAMES.SET_SPAWN_PROXY);
            }}>
            {'Change spawn proxy'}
          </Button>

          <Button
            disabled={!canSetManagementProxy}
            prop-size={'sm'}
            prop-type={'link'}
            onClick={() => {
              history.push(ROUTE_NAMES.SET_MANAGEMENT_PROXY);
            }}>
            {'Change management proxy'}
          </Button>

          <Button
            disabled={!canConfigureKeys}
            prop-size={'sm'}
            prop-type={'link'}
            onClick={() => {
              history.push(ROUTE_NAMES.SET_KEYS);
            }}>
            {'Set network keys'}
          </Button>

          <Button
            disabled={!canTransfer}
            prop-size={'sm'}
            prop-type={'link'}
            onClick={() => {
              history.push(ROUTE_NAMES.TRANSFER);
            }}>
            {'Transfer'}
          </Button>
          <Button
            prop-size={'sm'}
            prop-type={'link'}
            onClick={() => {
              history.push(ROUTE_NAMES.INVITES_MANAGE);
            }}>
            {'Invite'}
          </Button>
        </Grid.Item>
      </Grid>
    </div>
  );
}

export default Actions;
