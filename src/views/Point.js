import React, { useCallback } from 'react';
import { Just } from 'folktale/maybe';
import * as need from 'lib/need';
import { Grid } from 'indigo-react';
import { azimuth } from 'azimuth-js';

import { usePointCursor } from 'store/pointCursor';

import View from 'components/View';
import Greeting from 'components/Greeting';
import Passport from 'components/Passport';
import { ForwardButton, BootArvoButton } from 'components/Buttons';
import { matchBlinky } from 'components/Blinky';

import useInvites from 'lib/useInvites';
import { useSyncOwnedPoints } from 'lib/useSyncPoints';
import useCurrentPermissions from 'lib/useCurrentPermissions';
import { useLocalRouter } from 'lib/LocalRouter';

export default function Point() {
  const { pop, push, names } = useLocalRouter();
  const { pointCursor } = usePointCursor();

  const point = need.point(pointCursor);

  const {
    isParent,
    isActiveOwner,
    canManage,
    canSpawn,
  } = useCurrentPermissions();

  // fetch the invites for the current cursor
  const { availableInvites } = useInvites(point);

  const goAdmin = useCallback(() => push(names.ADMIN), [push, names]);

  const goInvite = useCallback(() => push(names.INVITE), [push, names]);

  const goPartiesSetPoolSize = useCallback(
    () => push(names.PARTY_SET_POOL_SIZE),
    [push, names]
  );

  const goIssuePoint = useCallback(() => push(names.ISSUE_CHILD), [
    names.ISSUE_CHILD,
    push,
  ]);

  const inviteButton = (() => {
    switch (azimuth.getPointSize(point)) {
      case azimuth.PointSize.Planet:
        const availableInvitesText = matchBlinky(availableInvites);
        return (
          <>
            <Grid.Item
              full
              as={ForwardButton}
              disabled={!isActiveOwner}
              onClick={goInvite}>
              Invite <sup>{availableInvitesText}</sup>
            </Grid.Item>
            <Grid.Divider />
          </>
        );
      //
      case azimuth.PointSize.Star:
        return (
          <>
            <Grid.Item
              full
              as={ForwardButton}
              disabled={!isActiveOwner}
              onClick={goPartiesSetPoolSize}>
              Manage Parties
            </Grid.Item>
            <Grid.Divider />
          </>
        );
      //
      default:
        return null;
    }
  })();

  // sync the current cursor
  useSyncOwnedPoints([point]);

  return (
    <View pop={pop} inset>
      <Greeting point={point} />
      <Passport point={Just(point)} />
      <Grid className="pt2">
        {inviteButton}
        <Grid.Item
          full
          as={ForwardButton}
          disabled={!canManage}
          onClick={goAdmin}>
          Admin
        </Grid.Item>
        <Grid.Divider />
        {isParent && (
          <>
            <Grid.Item
              full
              as={ForwardButton}
              disabled={!canSpawn}
              onClick={goIssuePoint}>
              Issue Point
            </Grid.Item>
            <Grid.Divider />
          </>
        )}
        <Grid.Item full as={BootArvoButton} />
        <Grid.Divider />
      </Grid>
    </View>
  );
}
