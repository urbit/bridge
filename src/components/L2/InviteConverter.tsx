import {
  Checkbox,
  Col,
  Row,
  Button as IndigoButton,
  Text,
  Action,
} from '@tlon/indigo-react';
import { Button } from 'indigo-react';
import Modal from './Modal';
import { useCallback, useEffect, useState } from 'react';
import { ReactComponent as InviteIcon } from 'assets/invite.svg';
import Point from 'lib/types/Point';
import useRoller from 'lib/useRoller';
import BodyPane from './Window/BodyPane';
import {
  InviteGeneratingStatus,
  useInvites,
  useInviteStore,
} from 'views/Invite/useInvites';
import { usePointCache } from 'store/pointCache';
import { CreatingInvitesModal } from './CreatingInvitesModal';
import { useWallet } from 'store/wallet';
import { WALLET_TYPES } from 'lib/constants';

interface StarMap {
  [key: string]: {
    point: Point;
    children: Point[];
  };
}

interface InviteConverterProps {
  points: Point[];
}

function selectText(selected: string[], children: Point[]) {
  if (
    allChildrenSelected(
      selected,
      children.map(p => p.patp)
    )
  ) {
    return 'Deselect All';
  }

  return 'Select All';
}

function allChildrenSelected(selected: string[], childrenPatps: string[]) {
  const filtered = childrenPatps.filter(p => selected.includes(p));
  return filtered.length === childrenPatps.length;
}

export const InviteConverter = ({ points }: InviteConverterProps) => {
  const { syncControlledPoints }: any = usePointCache();
  const { walletType }: any = useWallet();
  const signatureFree =
    walletType === WALLET_TYPES.TICKET || walletType === WALLET_TYPES.SHARDS;
  const { api, getPendingTransactions, getAndUpdatePoint } = useRoller();
  const { inviteJobs } = useInviteStore();
  const { generateInviteCodes } = useInvites();
  const [show, setShow] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [starMap, setStarMap] = useState<StarMap>({});
  const [generatingStatus, setGeneratingStatus] = useState<
    InviteGeneratingStatus
  >('initial');
  const [error, setError] = useState('');
  const [created, setCreated] = useState(0);
  const [currentPoint, setCurrentPoint] = useState<Point>();
  const currentJob = inviteJobs[currentPoint?.value || 0];
  const signatureCount = selected.length * 3;

  useEffect(() => {
    if (!points) {
      return;
    }

    async function collect() {
      const pointMap: StarMap = {};
      const stars = points.filter(point => point.isStar && point.isL2Spawn);

      for (const star of stars) {
        const spawns = await api.getSpawned(star.value);
        const filteredPoints = points.filter(
          p => spawns.includes(p.value) && p.isL2Spawn
        );

        if (filteredPoints.length !== 0) {
          pointMap[star.patp] = {
            point: star,
            children: filteredPoints,
          };
        }
      }

      setStarMap(pointMap);
    }

    collect();
  }, [points]);

  const selectChildren = useCallback(
    (children: Point[]) => {
      setSelected(state => {
        const childrenPatps = children.map(p => p.patp);
        const withoutChildren = state.filter(p => !childrenPatps.includes(p));

        if (allChildrenSelected(state, childrenPatps)) {
          return withoutChildren;
        } else {
          return withoutChildren.concat(childrenPatps);
        }
      });
    },
    [setSelected]
  );

  const togglePoint = useCallback(
    (point: Point) => {
      setSelected(state => {
        if (state.includes(point.patp)) {
          return state.filter(p => p !== point.patp);
        } else {
          return state.concat([point.patp]);
        }
      });
    },
    [setSelected]
  );

  const convert = useCallback(async () => {
    if (generatingStatus !== 'initial') {
      return;
    }

    setGeneratingStatus('generating');

    try {
      for (const { point, children } of Object.values(starMap)) {
        const filtered = children
          .filter(p => selected.includes(p.patp))
          .map(p => p.value);

        if (filtered.length <= 0) {
          continue;
        }

        setCurrentPoint(point);
        await generateInviteCodes(point, filtered, false);
        await getAndUpdatePoint(point.value);
        setCreated(children.length);
      }

      setGeneratingStatus('finished');
    } catch (error) {
      if (typeof error === 'object' && (error as Error)?.message) {
        setError((error as Error).message);
      } else if (typeof error === 'string') {
        setError(error);
      } else {
        setError('Creating invites failed');
      }
      setGeneratingStatus('errored');
    }
  }, [
    generatingStatus,
    selected,
    starMap,
    generateInviteCodes,
    getAndUpdatePoint,
  ]);

  const hasPlanets =
    Object.entries(starMap).reduce((sum, [, star]) => {
      return (sum += star.children.length);
    }, 0) > 0;

  if (generatingStatus !== 'initial') {
    return (
      <CreatingInvitesModal
        status={generatingStatus}
        current={created + currentJob?.generatingNum}
        total={selected.length}
        error={error}
        hide={() => {
          setGeneratingStatus('initial');
          setSelected([]);
          setShow(false);
          setCreated(0);
          getPendingTransactions();
          syncControlledPoints();
        }}
      />
    );
  }

  return (
    <>
      {/*
        @ts-ignore */}
      <Button className="create-invites" center onClick={() => setShow(true)}>
        Update Invites
      </Button>
      <Modal small show={show} hide={() => setShow(false)}>
        <BodyPane p={0}>
          <Col width="368px">
            <Row alignItems="center" mb={3}>
              <InviteIcon />
              <Text bold ml={2}>
                Updates invites for planets
              </Text>
            </Row>
            <Text mb={5}>
              Select L2 planets you own to convert them back into invite links
              under each star.{' '}
              <Text color="red" lineHeight="24px">
                Note: this will re-ticket the planets and render their existing
                keys invalid.
              </Text>
            </Text>
            {!signatureFree && (
              <Text bold className={!!signatureCount ? '' : 'hidden'}>
                {signatureCount} manual signatures will be required.
              </Text>
            )}
            <Col
              bg="washedGray"
              height="300px"
              mt={3}
              p={3}
              borderRadius={2}
              overflowY="auto"
              alignItems={hasPlanets ? '' : 'center'}
              justifyContent={hasPlanets ? '' : 'center'}>
              {Object.entries(starMap).map(([patp, { children }]) => (
                <Col mb={4}>
                  <Row>
                    <Text bold mb={2}>
                      Owned by {patp}
                    </Text>
                    <Action
                      backgroundColor="transparent"
                      ml="auto"
                      onClick={() => selectChildren(children)}>
                      {selectText(selected, children)}
                    </Action>
                  </Row>
                  {children.map((point, index) => (
                    <Row
                      alignItems="center"
                      justifyContent="space-between"
                      py={1}
                      borderBottomWidth={
                        index === children.length - 1 ? '0px' : '1px'
                      }
                      borderBottomStyle="solid"
                      borderBottomColor="washedGray">
                      <Text>{point.patp}</Text>
                      <Checkbox
                        selected={selected.includes(point.patp)}
                        onClick={() => togglePoint(point)}
                      />
                    </Row>
                  ))}
                </Col>
              ))}
              {!hasPlanets && <Text>No planets to update</Text>}
            </Col>
            <Row mt={3} justifyContent="end">
              <IndigoButton
                className="secondary"
                onClick={() => setShow(false)}>
                Close
              </IndigoButton>
              {/*
                @ts-ignore */}
              <IndigoButton
                className={selected.length === 0 ? '' : 'primary'}
                ml={2}
                onClick={convert}
                disabled={selected.length === 0}>
                Convert Selected
              </IndigoButton>
            </Row>
          </Col>
        </BodyPane>
      </Modal>
    </>
  );
};
