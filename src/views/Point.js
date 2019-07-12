import React, { useCallback, useMemo } from 'react';
import { Just } from 'folktale/maybe';
import * as need from 'lib/need';
import { Grid } from 'indigo-react';
import { azimuth } from 'azimuth-js';

import { usePointCursor } from 'store/pointCursor';
import { useHistory } from 'store/history';

import View from 'components/View';
import Passport from 'components/Passport';
import { ForwardButton } from 'components/Buttons';
import FooterButton from 'components/FooterButton';
import { matchBlinky } from 'components/Blinky';

import useInvites from 'lib/useInvites';
import { useSyncOwnedPoints } from 'lib/useSyncPoints';
import { ROUTE_NAMES } from 'lib/routeNames';

import Actions from './Point/Actions';
import { useWallet } from 'store/wallet';
import usePermissionsForPoint from 'lib/usePermissionsForPoint';

const isPlanet = point =>
  azimuth.getPointSize(point) === azimuth.PointSize.Planet;

export default function Point() {
  const history = useHistory();
  const { pointCursor } = usePointCursor();
  const { wallet } = useWallet();

  const point = need.point(pointCursor);

  const { isOwner, canManage } = usePermissionsForPoint(
    // using empty string should be ok here
    wallet.matchWith({
      Nothing: () => '',
      Just: p => p.value.address,
    }),
    point
  );

  // fetch the invites for the current cursor
  const { availableInvites } = useInvites(point);

  const showActions = Just.hasInstance(wallet);

  const goAdmin = useCallback(() => history.push(ROUTE_NAMES.ADMIN), [history]);

  const goInvite = useCallback(() => history.push(ROUTE_NAMES.INVITE), [
    history,
  ]);

  const inviteButton = useMemo(() => {
    switch (azimuth.getPointSize(point)) {
      case azimuth.PointSize.Planet:
        const availableInvitesText = matchBlinky(availableInvites);
        const goInvite = () => history.push(ROUTE_NAMES.INVITE);
        return (
          <FooterButton disabled={!isOwner} onClick={goInvite}>
            Invite <sup>{availableInvitesText} available</sup>
          </FooterButton>
        );
      //
      case azimuth.PointSize.Star:
        const goParties = () => history.push(ROUTE_NAMES.INVITES_MANAGE);
        return (
          <FooterButton disabled={!isOwner} onClick={goParties}>
            Manage parties
          </FooterButton>
        );
      //
      default:
        return null;
    }
  }, [point, history, isOwner, availableInvites]);

  // sync the current cursor
  useSyncOwnedPoints([point]);

  return (
    <View>
      <Passport point={Just(point)} />
      <Grid className="pt2">
        <Grid.Item
          full
          as={ForwardButton}
          disabled={!canManage}
          onClick={goAdmin}>
          Admin
        </Grid.Item>
        <Grid.Divider />
        <Grid.Item full as={ForwardButton} detail="Boot your computer" disabled>
          Boot Arvo
        </Grid.Item>
        {showActions && (
          <Grid.Item full>
            <Actions />
          </Grid.Item>
        )}
      </Grid>

      {inviteButton}
    </View>
  );
}
