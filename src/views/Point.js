import React, { useCallback, useEffect, useState } from 'react';
import cn from 'classnames';
import { Just } from 'folktale/maybe';
import { Grid, Flex, Button } from 'indigo-react';
import { Icon, Row } from '@tlon/indigo-react';
import { azimuth } from 'azimuth-js';

import { usePointCursor } from 'store/pointCursor';
import { useWallet } from 'store/wallet';
import { isL2, useRollerStore } from 'store/roller';

import View from 'components/View';
import Greeting from 'components/Greeting';
import Passport from 'components/Passport';
import Blinky from 'components/Blinky';
import BarGraph from 'components/BarGraph';
import Chip from 'components/Chip';
import InviteSigilList from 'components/InviteSigilList';
import { ForwardButton } from 'components/Buttons';
import L2PointHeader from 'components/L2/Headers/L2PointHeader';
import LayerIndicator from 'components/L2/LayerIndicator';
import Card from 'components/L2/Card';

import * as need from 'lib/need';
import useInvites from 'lib/useInvites';
import { useSyncExtras } from 'lib/useSyncPoints';
import useCurrentPermissions from 'lib/useCurrentPermissions';
import { useLocalRouter } from 'lib/LocalRouter';
import Inviter from 'views/Invite/Inviter';
import useRoller from 'lib/useRoller';

import './Point.scss';

function InviteForm({
  showInviteForm,
  setShowInviteForm,
  acceptedInvites,
  acceptedPoints,
  availableInvites,
  goCohort,
  pendingPoints,
  sentInvites,
  showInvites,
}) {
  const _totalInvites =
    sentInvites.getOrElse(0) + availableInvites.getOrElse(0);
  const _pendingInvites = pendingPoints.getOrElse([]).length;

  return (
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
  );
}

export default function Point() {
  const { pop, push, names } = useLocalRouter();
  const { wallet, authToken } = useWallet();
  const { pointCursor } = usePointCursor();
  const point = need.point(pointCursor);

  const { api, getInvites } = useRoller();
  const {
    pendingTransactions,
    nextRoll,
    invites,
    setCurrentPoint,
    setPendingTransactions,
  } = useRollerStore();

  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const loadL2Info = async () => {
      const getTransactions = async () => {
        const pointInfo = await api.getPoint(Number(point));
        setCurrentPoint(pointInfo);

        getInvites(isL2(pointInfo.dominion));
      };

      if (!loaded) {
        getTransactions();
        setLoaded(true);
      }
    };

    loadL2Info();
  }, [api, point, authToken, setPendingTransactions, loaded]); // eslint-disable-line

  const { isParent, canManage, canSpawn, canVote } = useCurrentPermissions();

  // L1 invites
  const l1Invites = useInvites(point);
  const {
    availableInvites,
    sentInvites,
    acceptedInvites,
    pendingPoints,
    acceptedPoints,
  } = l1Invites;

  const showInvites = !(
    acceptedInvites.getOrElse(0) === 0 && sentInvites.getOrElse(0) === 0
  );

  const hasInvites = showInvites || availableInvites.getOrElse(0) !== 0;

  const loadedInvites = Just.hasInstance(availableInvites);
  //
  // availableInvites.getOrElse(0) === 0

  const goSenate = useCallback(() => push(names.SENATE), [push, names]);

  const goCohort = useCallback(() => push(names.INVITE_COHORT), [push, names]);

  const goUrbitOS = useCallback(() => push(names.URBIT_OS), [push, names]);

  const goUrbitID = useCallback(() => push(names.URBIT_ID), [push, names]);

  const goResidents = useCallback(() => push(names.RESIDENTS), [push, names]);

  const goIssuePoint = useCallback(() => push(names.ISSUE_CHILD), [
    names.ISSUE_CHILD,
    push,
  ]);

  const isPlanet = azimuth.getPointSize(point) === azimuth.PointSize.Planet;

  const [showInviteForm, setShowInviteForm] = useState(false);

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
  useSyncExtras([point]);

  const address = need.addressFromWallet(wallet);
  const numPending = pendingTransactions.length;

  return (
    <View
      pop={pop}
      inset
      className="point"
      header={
        <L2PointHeader hideTimer={!!numPending} numInvites={invites.length} />
      }>
      <Greeting point={point} />
      {!!numPending && (
        <div className="transaction">
          <Row className="title-row">
            <div className="title">
              {numPending} Planet{numPending > 1 ? 's' : ''} Spawned
            </div>
            <div className="rollup-timer">{nextRoll}</div>
          </Row>
          <Row className="info-row">
            <LayerIndicator layer={2} size="sm" />
            <div className="date"></div>
          </Row>
        </div>
      )}
      <Passport
        point={Just(point)}
        address={Just(address)}
        animationMode={'slide'}
      />
      <Grid gap={4}>
        {isParent && (
          <Grid.Item full as={Flex} justify="between">
            <Card
              title="Residency"
              subtitle="Manage peers that you service"
              onClick={goResidents}
            />
          </Grid.Item>
        )}
        {isPlanet && hasInvites && (
          <InviteForm
            showInviteForm={showInviteForm}
            setShowInviteForm={setShowInviteForm}
            acceptedInvites={acceptedInvites}
            acceptedPoints={acceptedPoints}
            availableInvites={availableInvites}
            goCohort={goCohort}
            pendingPoints={pendingPoints}
            sentInvites={sentInvites}
            showInvites={showInvites}
          />
        )}
        {!loadedInvites && isPlanet && (
          <Grid.Item className="mv2" full>
            Invite Group <Blinky />
          </Grid.Item>
        )}
        {/* {inviteButton} */}
        <Grid.Item full as={Flex} justify="between">
          <Card
            title="ID"
            subtitle="Identity and security settings"
            icon={<Icon icon="User" />}
            onClick={goUrbitID}
            disabled={!canManage}
          />
        </Grid.Item>
        <Grid.Item full as={Flex} justify="between">
          <Card
            title="OS"
            subtitle="Urbit OS Settings"
            icon={<Icon icon="Server" />}
            onClick={goUrbitOS}
            disabled={!canManage}
          />
        </Grid.Item>
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
      </Grid>
    </View>
  );
}
