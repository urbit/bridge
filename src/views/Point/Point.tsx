import { useCallback, useEffect, useMemo, useState } from 'react';
import { azimuth } from 'azimuth-js';
import { Just } from 'folktale/maybe';
import { Grid, Flex } from 'indigo-react';
import { Box, Icon, Row, Button } from '@tlon/indigo-react';

import { usePointCursor } from 'store/pointCursor';
import { useWallet } from 'store/wallet';
import { useRollerStore } from 'store/roller';

import View from 'components/View';
import Greeting from 'components/Greeting';
import Passport from 'components/Passport';
import Blinky from 'components/Blinky';
import { ForwardButton } from 'components/Buttons';
import L2PointHeader from 'components/L2/Headers/L2PointHeader';
import LayerIndicator from 'components/L2/LayerIndicator';
import Card from 'components/L2/Card';

import * as need from 'lib/need';
import useInvites from 'lib/useInvites';
import useCurrentPermissions from 'lib/useCurrentPermissions';
import { useLocalRouter } from 'lib/LocalRouter';
import useRoller from 'lib/useRoller';

import './Point.scss';
import { isL2 } from 'lib/utils/roller';
import { isDevelopment } from 'lib/flags';
import { usePointCache } from 'store/pointCache';
import Modal from 'components/L2/Modal';
import { isPlanet } from 'lib/utils/point';
import { useHasNetworkKeysSet } from 'lib/useHasNetworkKeysSet';
import { InviteForm } from './InviteForm';

export default function Point() {
  const { pop, push, names } = useLocalRouter();
  const { wallet } = useWallet();
  const { pointCursor } = usePointCursor();
  const point = need.point(pointCursor);
  const { syncExtras } = usePointCache();
  const { api, getInvites } = useRoller();
  const {
    pendingTransactions,
    nextRoll,
    invites,
    setCurrentPoint,
    setNonces,
    increaseNonce,
  } = useRollerStore();
  const networkKeysSet = useHasNetworkKeysSet();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    setShowModal(!networkKeysSet);
  }, [networkKeysSet]);

  const loadL1Info = useCallback(async () => {
    await syncExtras(point);
  }, [point, syncExtras]);

  const loadL2Info = useCallback(async () => {
    const getTransactions = async () => {
      const pointInfo = await api.getPoint(Number(point));
      const pendingTxs = await api.getPendingByShip(Number(point));
      if (isDevelopment) {
        console.log('POINT INFO', pointInfo);
      }
      setNonces(point, pointInfo.ownership);

      for (let index = 0; index < pendingTxs.length; index++) {
        const proxy = pendingTxs[index].rawTx?.from?.proxy;
        console.log(pointInfo.ownership, proxy);
        increaseNonce(point, proxy);
      }
      setCurrentPoint(pointInfo);
      await getInvites(isL2(pointInfo.dominion));
    };

    await getTransactions();
  }, [api, point, setCurrentPoint, increaseNonce, getInvites, setNonces]);

  useEffect(() => {
    loadL1Info();
    loadL2Info();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [point]);

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

  const goSenate = useCallback(() => push(names.SENATE), [push, names]);

  const goCohort = useCallback(() => push(names.INVITE_COHORT), [push, names]);

  const goUrbitOS = useCallback(() => push(names.URBIT_OS), [push, names]);

  const goUrbitID = useCallback(() => push(names.URBIT_ID), [push, names]);

  const goResidents = useCallback(() => push(names.RESIDENTS), [push, names]);

  const goIssuePoint = useCallback(() => push(names.ISSUE_CHILD), [
    names.ISSUE_CHILD,
    push,
  ]);

  const planet = isPlanet(point);

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

  const address = need.addressFromWallet(wallet);

  const numPending = useMemo(() => {
    return pendingTransactions.filter(
      ({ rawTx }) => rawTx?.tx?.type === 'spawn'
    ).length;
  }, [pendingTransactions]);

  return (
    <View
      pop={pop}
      inset
      className="point"
      hideBack
      header={
        <L2PointHeader
          hideTimer={!!numPending}
          numInvites={invites.length}
          hideInvites={!networkKeysSet}
        />
      }>
      <Greeting point={point} />
      {!!numPending && (
        <div className="transaction">
          <Row className="title-row">
            <div className="title">
              {numPending} Planet
              {numPending > 1 ? 's' : ''} Spawned
            </div>
            <div className="rollup-timer">
              <Icon icon="Clock" />
              {nextRoll}
            </div>
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
        {planet && hasInvites && (
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
        {!loadedInvites && planet && (
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
      <Modal show={showModal} hide={() => setShowModal(false)}>
        <Box className="network-keys-modal">
          <Box className="close" onClick={() => setShowModal(false)}>
            &#215;
          </Box>
          <Box className="title">Network Keys Not Set</Box>
          <Box className="message">
            This point's network keys are not set. The network keys must be set
            to spawn points or migrate to Layer 2. Please set them in Urbit OS
            Settings.
          </Box>
          <Row className="buttons">
            <Button className="cancel" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button className="migrate" onClick={goUrbitOS}>
              Set Keys
            </Button>
          </Row>
        </Box>
      </Modal>
    </View>
  );
}
