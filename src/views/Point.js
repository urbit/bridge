import React, { useCallback } from 'react';
import { Just } from 'folktale/maybe';
import * as need from 'lib/need';
import { Grid } from 'indigo-react';
import { azimuth } from 'azimuth-js';

import { usePointCursor } from 'store/pointCursor';
import { useHistory } from 'store/history';

import View from 'components/View';
import Passport from 'components/Passport';
import { ForwardButton, BootArvoButton } from 'components/Buttons';
import FooterButton from 'components/FooterButton';
import { matchBlinky } from 'components/Blinky';

import useInvites from 'lib/useInvites';
import { useSyncOwnedPoints } from 'lib/useSyncPoints';

import Actions from './Point/Actions';
import { useWallet } from 'store/wallet';
import usePermissionsForPoint from 'lib/usePermissionsForPoint';

export default function Point() {
  const { push, names } = useHistory();
  const { pointCursor } = usePointCursor();
  const { wallet } = useWallet();

  const point = need.point(pointCursor);

  const { isActiveOwner, canManage } = usePermissionsForPoint(
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

  const goAdmin = useCallback(() => push(names.ADMIN), [push, names]);

  const goInvite = useCallback(() => push(names.INVITE), [push, names]);

  const goParties = useCallback(() => push(names.INVITES_MANAGE), [
    push,
    names,
  ]);

  const inviteButton = (() => {
    switch (azimuth.getPointSize(point)) {
      case azimuth.PointSize.Planet:
        const availableInvitesText = matchBlinky(availableInvites);
        return (
          <FooterButton disabled={!isActiveOwner} onClick={goInvite}>
            Invite <sup>{availableInvitesText} available</sup>
          </FooterButton>
        );
      //
      case azimuth.PointSize.Star:
        return (
          <FooterButton disabled={!isActiveOwner} onClick={goParties}>
            Manage parties
          </FooterButton>
        );
      //
      default:
        return null;
    }
  })();

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
        <Grid.Item full as={BootArvoButton} disabled />
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
