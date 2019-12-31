import React, { useCallback, useState } from 'react';
import { Just, Nothing } from 'folktale/maybe';
import { Grid } from 'indigo-react';
import { azimuth } from 'azimuth-js';
import cn from 'classnames';
import { take } from 'lodash';
import ob from 'urbit-ob';

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
import MaybeSigil from 'components/MaybeSigil';

import * as need from 'lib/need';
import useInvites from 'lib/useInvites';
import { useSyncOwnedPoints } from 'lib/useSyncPoints';
import useCurrentPermissions from 'lib/useCurrentPermissions';
import { useLocalRouter } from 'lib/LocalRouter';
import useKeyfileGenerator from 'lib/useKeyfileGenerator';

import InviteCohort from 'views/Invite/Cohort';

const InviteSigilList = ({ className, pendingPoints, acceptedPoints }) => {
  const _acceptedPoints = take(
    acceptedPoints.getOrElse([]).map(x => Just(ob.patp(x))),
    6
  );

  const _pendingPoints = take(
    pendingPoints.getOrElse([]).map(x => Just(ob.patp(x))),
    6 - _acceptedPoints.length
  );

  const empty = [
    ...Array(
      Math.max(6 - _acceptedPoints.length - _pendingPoints.length, 0)
    ).keys(),
  ].map(() => Nothing());

  const renderSigil = (points, colors, klassName) => {
    return (
      <>
        {points.map((point, idx) => (
          <div className={cn(klassName, 'h9 w9')}>
            <MaybeSigil patp={point} size={50} colors={colors} />
          </div>
        ))}
      </>
    );
  };

  return (
    <div className={cn('flex justify-between', className)}>
      {renderSigil(_acceptedPoints, ['#000000', '#FFFFFF'])}
      {renderSigil(_pendingPoints, ['#ee892b', '#FFFFFF'])}
      {renderSigil(empty, [], 'b1 b-black')}
    </div>
  );
};

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
  //&&
  // availableInvites.getOrElse(0) === 0

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
            <Grid.Item full>
              Invite Group
              <br />
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
