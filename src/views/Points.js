import React, { useCallback, useEffect, useMemo } from 'react';
import { Just, Nothing } from 'folktale/maybe';
import { Grid, H5, H1, HelpText, LinkButton, Flex } from 'indigo-react';
import { get } from 'lodash';

import { useHistory } from 'store/history';
import { useWallet } from 'store/wallet';
import { usePointCache } from 'store/pointCache';
import { usePointCursor } from 'store/pointCursor';

import * as need from 'lib/need';
import { isZeroAddress, abbreviateAddress } from 'lib/wallet';
import useIsEclipticOwner from 'lib/useIsEclipticOwner';
import { useSyncKnownPoints } from 'lib/useSyncPoints';

import View from 'components/View';
import Blinky from 'components/Blinky';
import Passport from 'components/Passport';
import useRejectedIncomingPointTransfers from 'lib/useRejectedIncomingPointTransfers';
import pluralize from 'lib/pluralize';
import Footer from 'components/Footer';
import { ForwardButton } from 'components/Buttons';
import useCopiable from 'lib/useCopiable';

const maybeGetResult = (obj, key, defaultValue) =>
  obj.matchWith({
    Nothing: () => defaultValue,
    Just: p =>
      p.value.matchWith({
        Ok: r => get(r.value, key, defaultValue),
        Error: e => defaultValue,
      }),
  });

const hasTransferProxy = details => !isZeroAddress(details.transferProxy);

const PointList = function({ points, className, actions, ...rest }) {
  const { setPointCursor } = usePointCursor();
  const { push, names } = useHistory();

  return (
    <Grid gap={3} className={className}>
      {points.map((point, i) => (
        <Grid.Item
          key={point}
          className={`full half-${(i % 2) + 1}-md half-${(i % 2) + 1}-lg`}>
          <Flex col>
            <Passport.Mini
              point={point}
              className="pointer"
              onClick={() => {
                setPointCursor(Just(point));
                push(names.POINT);
              }}
              {...rest}
            />
            {actions && (
              <Flex.Item className="mt2">{actions(point, i)}</Flex.Item>
            )}
          </Flex>
        </Grid.Item>
      ))}
    </Grid>
  );
};

function ActionButtons({ actions = [] }) {
  return (
    <Flex row>
      {actions.map(action => (
        <Flex.Item
          key={action.text}
          as={LinkButton}
          className="mr3"
          onClick={action.onClick}>
          {action.text}
        </Flex.Item>
      ))}
    </Flex>
  );
}

export default function Points() {
  const { wallet } = useWallet();
  const { pop, push, popAndPush, names } = useHistory();
  const { setPointCursor } = usePointCursor();
  const { controlledPoints, getDetails } = usePointCache();
  const isEclipticOwner = useIsEclipticOwner();
  const [
    rejectedPoints,
    addRejectedPoint,
  ] = useRejectedIncomingPointTransfers();

  const maybeOutgoingPoints = useMemo(
    () =>
      controlledPoints.chain(points =>
        points.matchWith({
          Error: () => Nothing(),
          Ok: c => {
            const points = c.value.ownedPoints.map(point =>
              getDetails(point).chain(details =>
                Just({ point: point, has: hasTransferProxy(details) })
              )
            );
            // if we have details for every point,
            // return the array of pending transfers.
            if (points.every(p => Just.hasInstance(p))) {
              const outgoing = points
                .filter(p => p.value.has)
                .map(p => p.value.point);
              return Just(outgoing);
            } else {
              return Nothing();
            }
          },
        })
      ),
    [getDetails, controlledPoints]
  );

  // if we can only interact with a single point, forget about the existence
  // of this page and jump to the point page.
  // if there are any pending transfers, incoming or outgoing, stay on this
  // page, because those can only be completed/cancelled here.
  useEffect(() => {
    if (Nothing.hasInstance(maybeOutgoingPoints)) {
      return;
    }
    controlledPoints.matchWith({
      Nothing: () => null,
      Just: r => {
        r.value.matchWith({
          Error: () => null,
          Ok: c => {
            let all = [
              ...c.value.ownedPoints,
              ...c.value.votingPoints,
              ...c.value.managingPoints,
              ...c.value.spawningPoints,
            ];
            const incoming = c.value.incomingPoints.filter(
              p => !rejectedPoints.includes(p)
            );
            if (
              all.length === 1 &&
              incoming.length === 0 &&
              maybeOutgoingPoints.value.length === 0
            ) {
              setPointCursor(Just(all[0]));
              popAndPush(names.POINT);
            }
          },
        });
      },
    });
  }, [
    controlledPoints,
    rejectedPoints,
    maybeOutgoingPoints,
    setPointCursor,
    popAndPush,
    names,
  ]);

  const address = need.addressFromWallet(wallet);
  const [doCopy, didCopy] = useCopiable(address);

  const loading = Nothing.hasInstance(controlledPoints);

  const ownedPoints = maybeGetResult(controlledPoints, 'ownedPoints', []);
  const incomingPoints = maybeGetResult(
    controlledPoints,
    'incomingPoints',
    []
  ).filter(point => !rejectedPoints.includes(point));
  const managingPoints = maybeGetResult(controlledPoints, 'managingPoints', []);
  const votingPoints = maybeGetResult(controlledPoints, 'votingPoints', []);
  const spawningPoints = maybeGetResult(controlledPoints, 'spawningPoints', []);
  const outgoingPoints = maybeOutgoingPoints.getOrElse([]);

  const allPoints = [
    ...ownedPoints.filter(p => !outgoingPoints.includes(p)),
    ...managingPoints,
    ...votingPoints,
    ...spawningPoints,
  ];

  const displayEmptyState =
    !loading && incomingPoints.length === 0 && allPoints.length === 0;

  // sync display details for known points
  useSyncKnownPoints([
    ...ownedPoints,
    ...incomingPoints,
    ...managingPoints,
    ...votingPoints,
    ...spawningPoints,
  ]);

  const goCreateGalaxy = useCallback(() => push(names.CREATE_GALAXY), [
    names.CREATE_GALAXY,
    push,
  ]);

  const goViewPoint = useCallback(() => push(names.VIEW_POINT), [
    names.VIEW_POINT,
    push,
  ]);

  return (
    <View pop={pop} inset>
      <Grid>
        <Grid.Item
          full
          as={H1}
          className="f6 mono gray4 mb4 us-none clickable"
          onClick={doCopy}>
          {`${abbreviateAddress(address)}${didCopy ? ' (copied!)' : ''}`}
        </Grid.Item>

        {loading && (
          <Grid.Item full as={HelpText} className="mt8 t-center">
            <Blinky /> Loading...
          </Grid.Item>
        )}

        {displayEmptyState && (
          <Grid.Item full as={HelpText} className="mt8 t-center">
            No points to display. This wallet is not the owner or proxy for any
            points.
          </Grid.Item>
        )}

        {incomingPoints.length > 0 && (
          <Grid.Item full as={Grid} gap={1} className="mb6">
            <Grid.Item full as={H5}>
              {pluralize(
                incomingPoints.length,
                'Incoming Transfer',
                'Incoming Transfers'
              )}
            </Grid.Item>
            <Grid.Item
              full
              as={PointList}
              points={incomingPoints}
              actions={(point, i) => (
                <ActionButtons
                  actions={[
                    {
                      text: 'Accept',
                      onClick: () => {
                        setPointCursor(Just(point));
                        push(names.ACCEPT_TRANSFER);
                      },
                    },
                    {
                      text: 'Reject',
                      onClick: () => {
                        addRejectedPoint(point);
                      },
                    },
                  ]}
                />
              )}
              inverted
            />
          </Grid.Item>
        )}

        {outgoingPoints.length > 0 && (
          <Grid.Item full as={Grid} gap={1} className="mb6">
            <Grid.Item full as={H5}>
              {pluralize(
                outgoingPoints.length,
                'Outgoing Transfer',
                'Outgoing Transfers'
              )}
            </Grid.Item>
            <Grid.Item
              full
              as={PointList}
              points={outgoingPoints}
              actions={(point, i) => (
                <ActionButtons
                  actions={[
                    {
                      text: 'Cancel',
                      onClick: () => {
                        setPointCursor(Just(point));
                        // TODO: deep linking to fix this duplicate route
                        push(names.CANCEL_TRANSFER);
                      },
                    },
                  ]}
                />
              )}
              inverted
            />
          </Grid.Item>
        )}

        {allPoints.length > 0 && (
          <Grid.Item full as={Grid} gap={1}>
            <Grid.Item full as={H5}>
              {pluralize(allPoints.length, 'Point')}
            </Grid.Item>
            <Grid.Item full as={PointList} points={allPoints} />
          </Grid.Item>
        )}

        <Footer>
          <Grid>
            <Grid.Divider />
            {isEclipticOwner && (
              <>
                <Grid.Item
                  full
                  as={ForwardButton}
                  detail="You have the authority to create a new Galaxy."
                  onClick={goCreateGalaxy}>
                  Create a galaxy
                </Grid.Item>
                <Grid.Divider />
              </>
            )}
            <Grid.Item
              full
              as={ForwardButton}
              detail="View a point"
              onClick={goViewPoint}>
              View a point
            </Grid.Item>
          </Grid>
        </Footer>
      </Grid>
    </View>
  );
}
