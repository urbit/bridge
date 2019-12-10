import React, { useCallback } from 'react';
import { Just } from 'folktale/maybe';
import { Grid } from 'indigo-react';
import { azimuth } from 'azimuth-js';

import { usePointCursor } from 'store/pointCursor';
import { useWallet } from 'store/wallet';

import View from 'components/View';
import Greeting from 'components/Greeting';
import Passport from 'components/Passport';
import { ForwardButton, BootUrbitOSButton } from 'components/Buttons';
import CopyButton from 'components/CopyButton';
import { matchBlinky } from 'components/Blinky';
import DownloadSigilButton from 'components/DownloadSigilButton';

import * as need from 'lib/need';
import useInvites from 'lib/useInvites';
import { useSyncOwnedPoints } from 'lib/useSyncPoints';
import useCurrentPermissions from 'lib/useCurrentPermissions';
import { useLocalRouter } from 'lib/LocalRouter';
import useKeyfileGenerator from 'lib/useKeyfileGenerator';

export default function Point() {
  const { pop, push, names } = useLocalRouter();
  const { pointCursor } = usePointCursor();

  const { wallet } = useWallet();
  const point = need.point(pointCursor);

  const { code, notice } = useKeyfileGenerator();

  const {
    isParent,
    isActiveOwner,
    canManage,
    canSpawn,
    canVote,
  } = useCurrentPermissions();

  // fetch the invites for the current cursor
  const { availableInvites } = useInvites(point);

  const goAdmin = useCallback(() => push(names.ADMIN), [push, names]);

  const goSenate = useCallback(() => push(names.SENATE), [push, names]);

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
              Manage Invite Pools
            </Grid.Item>
            <Grid.Divider />
          </>
        );
      //
      default:
        return null;
    }
  })();

  const senateButton = (() => {
    if (azimuth.getPointSize(point) !== azimuth.PointSize.Galaxy) {
      return null;
    }
    return (
      <>
        <Grid.Item
          full
          as={ForwardButton}
          disabled={!canVote}
          onClick={goSenate}>
          Senate
        </Grid.Item>
        <Grid.Divider />
      </>
    );
  })();

  // sync the current cursor
  useSyncOwnedPoints([point]);

  const address = need.addressFromWallet(wallet);

  return (
    <View pop={pop} inset>
      <Greeting point={point} />
      <Passport
        point={Just(point)}
        address={Just(address)}
        animationMode={'slide'}
      />
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
        {senateButton}
        <Grid.Item full as={BootUrbitOSButton} />
        <Grid.Divider />
        <Grid.Item
          full
          as={ForwardButton}
          accessory={code && <CopyButton text={code} />}
          detail={code || notice}
          disabled={!code}
          detailClassName="mono">
          Login Code
        </Grid.Item>
        <Grid.Divider />
        <Grid.Item full as={DownloadSigilButton} point={point} />
        <Grid.Divider />
      </Grid>
    </View>
  );
}
