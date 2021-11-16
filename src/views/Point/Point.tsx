import { useCallback, useEffect, useState, useRef } from 'react';
import { Just } from 'folktale/maybe';
import { Grid, Flex } from 'indigo-react';
import { Box, Icon, Row, Button, Checkbox } from '@tlon/indigo-react';

import { usePointCursor } from 'store/pointCursor';
import { useWallet } from 'store/wallet';
import { useRollerStore } from 'store/roller';

import View from 'components/View';
import Greeting from 'components/Greeting';
import Passport from 'components/Passport';
import Blinky from 'components/Blinky';
import L2PointHeader from 'components/L2/Headers/L2PointHeader';
import LayerIndicator from 'components/L2/LayerIndicator';
import Card from 'components/L2/Card';

import * as need from 'lib/need';
import useInvites from 'lib/useInvites';
import useCurrentPermissions from 'lib/useCurrentPermissions';
import { useLocalRouter } from 'lib/LocalRouter';
import useRoller from 'lib/useRoller';
import useSeenMissingKeys from 'lib/useSeenMissingKeys';

import './Point.scss';
import { isL2 } from 'lib/utils/roller';
import { isDevelopment } from 'lib/flags';
import { usePointCache } from 'store/pointCache';
import Modal from 'components/L2/Modal';
import { isPlanet, isStar } from 'lib/utils/point';
import { useHasNetworkKeysSet } from 'lib/useHasNetworkKeysSet';
import { InviteForm } from './InviteForm';
import LoadingOverlay from 'components/L2/LoadingOverlay';

export default function Point() {
  const { pop, push, names }: any = useLocalRouter();
  const { wallet }: any = useWallet();
  const { pointCursor }: any = usePointCursor();
  const point = need.point(pointCursor);
  const networkKeysSet = useHasNetworkKeysSet();
  const { syncExtras }: any = usePointCache();

  const { api, getNumInvites, getPendingTransactions } = useRoller();
  const {
    pendingTransactions,
    nextRoll,
    invitePoints,
    setCurrentPoint,
    setInvites,
  } = useRollerStore();

  const [seenMissingKeys, setSeenMissingKeys] = useSeenMissingKeys();
  const [showModal, setShowModal] = useState(false);
  const [hideMessage, setHideMessage] = useState(false);
  const [loading, setLoading] = useState(false);

  const pointRef = useRef<number | null>(null);

  const hideModal = useCallback(() => {
    if (hideMessage) {
      setSeenMissingKeys(true);
    }

    setShowModal(false);
  }, [hideMessage, setShowModal, setSeenMissingKeys]);

  useEffect(() => {
    if (pointRef.current !== point) {
      pointRef.current = point;
      setShowModal(!networkKeysSet && !seenMissingKeys);
    }
  }, [networkKeysSet, seenMissingKeys, point]);

  const loadL1Info = useCallback(async () => {
    await syncExtras(point);
  }, [point, syncExtras]);

  const loadL2Info = useCallback(async () => {
    const getTransactions = async () => {
      setLoading(true);
      const pointInfo = await api.getPoint(Number(point));

      if (isDevelopment) {
        console.log('POINT INFO', pointInfo);
      }
      getPendingTransactions();
      setCurrentPoint(pointInfo);
      getNumInvites(isL2(pointInfo.dominion));

      setTimeout(() => setLoading(false), 100);
    };

    await getTransactions();
  }, [
    api,
    point,
    getNumInvites,
    setCurrentPoint,
    getPendingTransactions,
    setLoading,
  ]);

  useEffect(() => {
    loadL1Info();
    loadL2Info();
  }, [point]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setInvites([]);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const { isParent, canManage } = useCurrentPermissions();

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

  const goCohort = useCallback(() => push(names.INVITE_COHORT), [push, names]);

  const goUrbitOS = useCallback(() => {
    if (hideMessage) setSeenMissingKeys(hideMessage);

    push(names.URBIT_OS);
  }, [push, names, hideMessage, setSeenMissingKeys]);

  const goUrbitID = useCallback(() => push(names.URBIT_ID), [push, names]);

  const goOps = useCallback(() => push(names.OPS), [push, names]);

  const planet = isPlanet(point);

  const [showInviteForm, setShowInviteForm] = useState(false);

  const address = need.addressFromWallet(wallet);
  const spawnedPending = pendingTransactions.filter(
    ({ rawTx }) => rawTx?.tx?.type === 'spawn'
  ).length;
  const otherPending = pendingTransactions.filter(
    ({ rawTx }) => rawTx?.tx?.type !== 'spawn'
  );

  return (
    <View
      pop={pop}
      inset
      className="point"
      hideBack
      header={
        <L2PointHeader
          hideTimer={!!spawnedPending}
          numInvites={invitePoints.length}
          hideInvites={!networkKeysSet}
        />
      }>
      <Greeting point={point} />
      {!!spawnedPending && (
        <div className="transaction">
          <Row className="title-row">
            <div className="title">
              {spawnedPending} Planet{spawnedPending > 1 ? 's' : ''} Spawned
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
      {!!otherPending.length &&
        otherPending.map(pendingTx => (
          <div className="transaction">
            <Row className="title-row">
              <div className="title">
                {pendingTx.rawTx?.tx?.type === 'set-management-proxy'
                  ? 'Management Address Changed'
                  : pendingTx.rawTx?.tx?.type === 'configure-keys'
                  ? 'Network Keys Configured'
                  : pendingTx.rawTx?.tx?.type === 'transfer-point'
                  ? 'Point Transfered'
                  : pendingTx.rawTx?.tx?.type === 'set-transfer-proxy'
                  ? 'Transfer Proxy Changed'
                  : pendingTx.rawTx?.tx?.type === 'set-spawn-proxy'
                  ? 'Spawn Proxy Changed'
                  : pendingTx.rawTx?.tx?.type === 'detach'
                  ? 'Sponsee Detached'
                  : ''}
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
        ))}
      <Passport
        point={Just(point)}
        address={Just(address)}
        animationMode={'slide'}
      />
      <Grid gap={4}>
        {isParent && (
          <Grid.Item full as={Flex} justify="between">
            <Card
              icon={(<Icon icon="ShipActivated" />) as any}
              title={`${isStar(point) ? 'Star' : 'Galaxy'} Ops`}
              subtitle={
                isStar(point)
                  ? 'Residents, Requests, Spawn Planets'
                  : 'Residents, Requests, Spawn Stars, Vote'
              }
              onClick={goOps}
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
            subtitle="Master Key, Passport, Proxy Addresses, etc"
            icon={(<Icon icon="User" />) as any}
            onClick={goUrbitID}
            disabled={!canManage}
          />
        </Grid.Item>
        <Grid.Item full as={Flex} justify="between">
          <Card
            title="OS"
            subtitle="Sponsor, Network Keys, Access Key"
            icon={(<Icon icon="Server" />) as any}
            onClick={goUrbitOS}
            disabled={!canManage}
          />
        </Grid.Item>
      </Grid>
      <Modal show={showModal} hide={hideModal}>
        <Box className="network-keys-modal">
          <Box className="close" onClick={hideModal}>
            &#215;
          </Box>
          <Box className="title">No Network Keys Found</Box>
          <Box className="message">
            Network Keys are required to generate a Keyfile and use Landscape.
          </Box>
          <Row className="hide-row">
            <Checkbox
              className="checkbox"
              selected={hideMessage}
              onClick={() => setHideMessage(!hideMessage)}
            />
            <Box className="dont-show">Do not warn me again</Box>
          </Row>
          <Row className="buttons">
            <Button className="cancel" onClick={hideModal}>
              Cancel
            </Button>
            <Button className="migrate" onClick={goUrbitOS}>
              Set Network Keys
            </Button>
          </Row>
        </Box>
      </Modal>
      <LoadingOverlay loading={loading} />
    </View>
  );
}
