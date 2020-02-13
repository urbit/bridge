import React, { useCallback, useState } from 'react';
import cn from 'classnames';
import { Just } from 'folktale/maybe';
import { Grid, Flex, Button } from 'indigo-react';
import { azimuth } from 'azimuth-js';

import { usePointCursor } from 'store/pointCursor';
import { useWallet } from 'store/wallet';

import View from 'components/View';
import Greeting from 'components/Greeting';
import Passport from 'components/Passport';
import { ForwardButton, BootUrbitOSButton } from 'components/Buttons';
import CopyButton from 'components/CopyButton';
import Blinky from 'components/Blinky';
import BarGraph from 'components/BarGraph';
import Chip from 'components/Chip';
import InviteSigilList from 'components/InviteSigilList';

import * as need from 'lib/need';
import useInvites from 'lib/useInvites';
import { useSyncOwnedPoints } from 'lib/useSyncPoints';
import useCurrentPermissions from 'lib/useCurrentPermissions';
import { useLocalRouter } from 'lib/LocalRouter';
import useKeyfileGenerator from 'lib/useKeyfileGenerator';

import Inviter from 'views/Invite/Inviter';

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

  const loadedInvites = Just.hasInstance(availableInvites);
  //
  // availableInvites.getOrElse(0) === 0

  const goAdmin = useCallback(() => push(names.ADMIN), [push, names]);

  const goSenate = useCallback(() => push(names.SENATE), [push, names]);

  const goSigil = useCallback(() => push(names.SIGIL_GENERATOR), [push, names]);

  const goCohort = useCallback(() => push(names.INVITE_COHORT), [push, names]);

  const goUrbitOS = useCallback(() => push(names.URBIT_OS), [push, names]);

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
    if (azimuth.getPointSize(point) === azimuth.PointSize.Star) {
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
    }

    return null;
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
      <Grid gap={3}>
        {isPlanet && hasInvites && (
          <>
            <Grid.Item cols={[1, 11]}>
              Invite Group
              <br />
            </Grid.Item>

            <Grid.Item
              className={cn('t-right underline pointer-hover', {
                gray4: sentInvites.getOrElse(0) === 0,
              })}
              onClick={goCohort}
              cols={[11, 13]}>
              View
            </Grid.Item>
            <Grid.Item full>
              <Flex align="center">
                <Flex.Item>
                  {acceptedInvites.getOrElse(0)} / {_totalInvites}
                </Flex.Item>
                {_pendingInvites > 0 && (
                  <Flex.Item as={Chip} className="bg-yellow1 yellow4">
                    {_pendingInvites} pending
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
                as={Button}
                center
                onClick={() => setShowInviteForm(true)}>
                Add Members
              </Grid.Item>
            )}
            {showInviteForm && <Inviter />}
            <Grid.Item full className="mb2" />
          </>
        )}
        {!loadedInvites && isPlanet && (
          <Grid.Item className="mv2" full>
            Invite Group <Blinky />
          </Grid.Item>
        )}
      </Grid>
      <Grid className="pt2">
        {inviteButton}
        <Grid.Item full as={ForwardButton} onClick={goSigil}>
          Sigil
        </Grid.Item>
        <Grid.Divider />
        <Grid.Item
          full
          as={ForwardButton}
          disabled={!canManage}
          onClick={goUrbitOS}>
          Urbit OS
        </Grid.Item>
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
      </Grid>
    </View>
  );
}
