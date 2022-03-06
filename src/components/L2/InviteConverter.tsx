import {
  Checkbox,
  Col,
  H3,
  Row,
  Button as IndigoButton,
  Text,
} from '@tlon/indigo-react';
import { Button } from 'indigo-react';
import Modal from './Modal';
import { useCallback, useEffect, useState } from 'react';
import Point from 'lib/types/Point';
import useRoller from 'lib/useRoller';
import BodyPane from './Window/BodyPane';
import {
  InviteGeneratingStatus,
  useInvites,
  useInviteStore,
} from 'views/Invite/useInvites';
import { GeneratingModal } from 'views/Invite/GeneratingModal';
import { usePointCache } from 'store/pointCache';

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
  const { api, getPendingTransactions, getAndUpdatePoint } = useRoller();
  const { inviteJobs } = useInviteStore();
  const { generateInviteCodes } = useInvites();
  const [show, setShow] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [starMap, setStarMap] = useState<StarMap>({});
  const [generatingStatus, setGeneratingStatus] = useState<
    InviteGeneratingStatus
  >('initial');
  const [currentPoint, setCurrentPoint] = useState<Point>();
  const currentJob = inviteJobs[currentPoint?.value || 0];

  useEffect(() => {
    if (!points) {
      return;
    }

    async function collect() {
      const pointMap: StarMap = {};
      const stars = points.filter(point => point.isStar);

      for (const star of stars) {
        const spawns = await api.getSpawned(star.value);
        const filteredPoints = points.filter(p => spawns.includes(p.value));

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

    for (const { point, children } of Object.values(starMap)) {
      debugger;
      const filtered = children
        .filter(p => selected.includes(p.patp))
        .map(p => p.value);

      if (filtered.length <= 0) {
        continue;
      }

      setCurrentPoint(point);
      await generateInviteCodes(point, filtered, false);
      await getAndUpdatePoint(point.value);
    }

    getPendingTransactions();
    syncControlledPoints();
    setGeneratingStatus('finished');
  }, [
    generatingStatus,
    selected,
    starMap,
    generateInviteCodes,
    getAndUpdatePoint,
    getPendingTransactions,
    syncControlledPoints,
  ]);

  if (generatingStatus !== 'initial') {
    return (
      <GeneratingModal
        status={generatingStatus}
        current={currentJob?.generatingNum}
        total={
          generatingStatus === 'finished'
            ? selected.length
            : selected.filter(p => {
                const children = starMap[currentPoint?.patp || '']?.children;
                return children.map(c => c.patp).includes(p);
              }).length
        }
        fromStar={currentPoint?.patp}
        spawn={false}
        hide={() => {
          setGeneratingStatus('initial');
          setSelected([]);
          setShow(false);
          if (generatingStatus !== 'errored') {
            //pop();
          }
        }}
      />
    );
  }

  return (
    <>
      {/*
        @ts-ignore */}
      <Button solid center onClick={() => setShow(true)}>
        Convert to Invites
      </Button>
      <Modal show={show} hide={() => setShow(false)}>
        <BodyPane p={0}>
          <Col width="420px">
            <H3 mb={2}>Convert Planet Spawns to Invites</H3>
            <Text>
              This allows you to convert a spawned planets into invites. After
              this operation, invites will show up under the point they were
              spawned from.
            </Text>
            <Col
              bg="washedGray"
              height="300px"
              mt={3}
              p={2}
              borderRadius={2}
              overflowY="auto">
              {Object.entries(starMap).map(([patp, { children }]) => (
                <Col mb={4}>
                  <Row>
                    <Text mb={2} fontSize={2}>
                      Spawned by{' '}
                      <Text bold fontSize={2}>
                        {patp}
                      </Text>
                    </Text>
                    <IndigoButton
                      height="18px"
                      px={2}
                      fontSize={0}
                      ml="auto"
                      onClick={() => selectChildren(children)}>
                      {selectText(selected, children)}
                    </IndigoButton>
                  </Row>
                  {children.map(point => (
                    <Row
                      alignItems="center"
                      justifyContent="space-between"
                      ml={3}
                      mb={2}
                      py={1}
                      borderBottomWidth="1px"
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
            </Col>
            <Row mt={4} justifyContent="end">
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
                Convert
              </IndigoButton>
            </Row>
          </Col>
        </BodyPane>
      </Modal>
    </>
  );
};
