import React, { useCallback } from 'react';
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
        <Grid.Item key={point} className={`full half-${(i % 2) + 1}-md`}>
          <Flex col>
            <Passport.Mini
              point={point}
              className="clickable"
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
  const { pop, push, names } = useHistory();
  const { setPointCursor } = usePointCursor();
  const { controlledPoints, getDetails } = usePointCache();
  const isEclipticOwner = useIsEclipticOwner();
  const [
    rejectedPoints,
    addRejectedPoint,
  ] = useRejectedIncomingPointTransfers();

  const address = need.addressFromWallet(wallet);

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
  const outgoingPoints = ownedPoints.filter(point =>
    getDetails(point).matchWith({
      Nothing: () => false,
      Just: p => hasTransferProxy(p.value),
    })
  );

  const multipassPoints = [
    ...ownedPoints.filter(p => !outgoingPoints.includes(p)),
    ...managingPoints,
    ...votingPoints,
    ...spawningPoints,
  ];

  const displayEmptyState =
    !loading && incomingPoints.length === 0 && multipassPoints.length === 0;

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
        <Grid.Item full as={H1} className="f6 mono gray4 mb4">
          {abbreviateAddress(address)}
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

        {multipassPoints.length > 0 && (
          <Grid.Item full as={Grid} gap={1}>
            <Grid.Item full as={H5}>
              {pluralize(multipassPoints.length, 'Multipass', 'Multipasses')}
            </Grid.Item>
            <Grid.Item full as={PointList} points={multipassPoints} />
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
