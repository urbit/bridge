import React, { useCallback, useState } from 'react';
import { Just } from 'folktale/maybe';
import { Grid, Flex } from 'indigo-react';
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
import BarGraph from 'components/BarGraph';
import Chip from 'components/Chip';
import InviteSigilList from 'components/InviteSigilList';

import * as need from 'lib/need';
import useInvites from 'lib/useInvites';
import { useSyncOwnedPoints } from 'lib/useSyncPoints';
import useCurrentPermissions from 'lib/useCurrentPermissions';
import { useLocalRouter } from 'lib/LocalRouter';
import useKeyfileGenerator from 'lib/useKeyfileGenerator';

import InviteCohort from 'views/Invite/Cohort';

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
  } = useCurrentPermissions();

  // fetch the invites for the current cursor
  const invites = useInvites(point);
  const {
    availableInvites,
    sentInvites,
    acceptedInvites,
    pendingPoints,
    acceptedPoints,
  } = invites;

  const showInvites = !(
    acceptedInvites.getOrElse(0) === 0 && sentInvites.getOrElse(0) === 0
  );

  const hasInvites = showInvites || availableInvites.getOrElse(0) !== 0;

  const _totalInvites =
    sentInvites.getOrElse(0) + availableInvites.getOrElse(0);
  const _pendingInvites = pendingPoints.getOrElse([]).length;
  //
  // availableInvites.getOrElse(0) === 0

  const goAdmin = useCallback(() => push(names.ADMIN), [push, names]);

  const goInvite = useCallback(() => push(names.INVITE), [push, names]);

  const goParty = useCallback(() => push(names.PARTY), [push, names]);

  const goPartiesSetPoolSize = useCallback(
    () => push(names.PARTY_SET_POOL_SIZE),
    [push, names]
  );

  const goIssuePoint = useCallback(() => push(names.ISSUE_CHILD), [
    names.ISSUE_CHILD,
    push,
  ]);

  const isPlanet = azimuth.getPointSize(point) === azimuth.PointSize.Planet;

  const [showInviteForm, setShowInviteForm] = useState(false);

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
      <Grid gap={3}>
        {isPlanet && hasInvites && (
          <>
            <Grid.Item cols={[1, 11]}>
              Invite Group
              <br />
            </Grid.Item>

            <Grid.Item className="t-right" onClick={goParty} cols={[11, 13]}>
              View
            </Grid.Item>
            <Grid.Item full>
              <Flex align="center">
                <Flex.Item>
                  {acceptedInvites.getOrElse(0)} / {_totalInvites}
                </Flex.Item>
                {_pendingInvites > 0 && (
                  <Flex.Item as={Chip} color="yellow">
                    {_pendingInvites.getOrElse([]).length} pending
                  </Flex.Item>
                )}
              </Flex>
            </Grid.Item>

            {showInvites && (
              <>
                <Grid.Item
                  full
                  as={BarGraph}
                  available={availableInvites}
                  sent={sentInvites}
                  accepted={acceptedInvites}
                />
                <Grid.Item
                  full
                  as={InviteSigilList}
                  pendingPoints={pendingPoints}
                  acceptedPoints={acceptedPoints}
                />
              </>
            )}
            {!showInvites && (
              <>
                <Grid.Item full className="b-gray4 b-dotted b1 self-center">
                  <div className="p4 pv8 t-center gray4">
                    Start your invite group by adding members
                  </div>
                </Grid.Item>
              </>
            )}
            {!showInviteForm && availableInvites.getOrElse(0) > 0 && (
              <Grid.Item
                full
                solid
                as={ForwardButton}
                onClick={() => setShowInviteForm(true)}>
                Add Members
              </Grid.Item>
            )}
            {showInviteForm && <InviteCohort />}
          </>
        )}
      </Grid>
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
