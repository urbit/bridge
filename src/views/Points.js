import React from 'react';
import { Just, Nothing } from 'folktale/maybe';
import { Grid, H5, H1, HelpText, LinkButton, Flex } from 'indigo-react';

import { useHistory } from 'store/history';
import { useWallet } from 'store/wallet';
import { usePointCache } from 'store/pointCache';
import { usePointCursor } from 'store/pointCursor';

import * as need from 'lib/need';
import { ROUTE_NAMES } from 'lib/routeNames';
import { isZeroAddress, abbreviateAddress } from 'lib/wallet';
import useIsEclipticOwner from 'lib/useIsEclipticOwner';
import { useSyncKnownPoints } from 'lib/useSyncPoints';

import View from 'components/View';
import FooterButton from 'components/FooterButton';
import Blinky from 'components/Blinky';
import Passport from 'components/Passport';

const getFromMaybe = (obj, key, defaultValue) =>
  obj.matchWith({
    Nothing: () => defaultValue,
    Just: p =>
      p.value.matchWith({
        Ok: r => r.value[key],
        Error: e => defaultValue,
      }),
  });

const hasTransferProxy = (details, point) =>
  !isZeroAddress(details.transferProxy);

const PointList = function({ points, className, actions, ...rest }) {
  const { setPointCursor } = usePointCursor();
  const history = useHistory();

  return (
    <Grid gap={3} className={className}>
      {points.map((point, i) => (
        <Grid.Item half={(i % 2) + 1} key={point}>
          <Flex col>
            <Passport.Mini
              point={point}
              className="clickable"
              onClick={() => {
                setPointCursor(Just(point));
                history.push(history.names.POINT);
              }}
              {...rest}
            />
            <Flex.Item className="mt2">{actions}</Flex.Item>
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
  const history = useHistory();
  const { controlledPoints, getDetails } = usePointCache();
  const isEclipticOwner = useIsEclipticOwner();

  const address = need.addressFromWallet(wallet);

  const loading = Nothing.hasInstance(controlledPoints);

  const ownedPoints = getFromMaybe(controlledPoints, 'ownedPoints', []);
  const incomingPoints = getFromMaybe(controlledPoints, 'incomingPoints', []);
  const managingPoints = getFromMaybe(controlledPoints, 'managingPoints', []);
  const votingPoints = getFromMaybe(controlledPoints, 'votingPoints', []);
  const spawningPoints = getFromMaybe(controlledPoints, 'spawningPoints', []);
  const outgoingPoints = ownedPoints.filter(point =>
    getDetails(point).matchWith({
      Nothing: () => false,
      Just: p => hasTransferProxy(p.value),
    })
  );

  const multipassPoints = [
    ...ownedPoints,
    ...managingPoints,
    ...votingPoints,
    ...spawningPoints,
  ];

  // sync display details for known points
  useSyncKnownPoints([
    ...ownedPoints,
    ...incomingPoints,
    ...managingPoints,
    ...votingPoints,
    ...spawningPoints,
  ]);

  return (
    <View>
      <Grid className="mt6">
        <Grid.Item full as={H1} className="f6 mono gray4 mb4">
          {abbreviateAddress(address)}
        </Grid.Item>

        {loading && (
          <Grid.Item full as={HelpText} className="mt8 t-center">
            <Blinky /> Loading...
          </Grid.Item>
        )}

        {incomingPoints.length > 0 && (
          <Grid.Item full as={Grid} gap={1} className="mb6">
            <Grid.Item full as={H5}>
              Incoming Transfers
            </Grid.Item>
            <Grid.Item
              full
              as={PointList}
              points={incomingPoints}
              actions={
                <ActionButtons
                  actions={[
                    {
                      text: 'Accept',
                      onClick: () => {
                        // TODO: accept
                        console.log('accept');
                      },
                    },
                    {
                      text: 'Reject',
                      onClick: () => {
                        // TODO: reject
                        console.log('reject');
                      },
                    },
                  ]}
                />
              }
              inverted
            />
          </Grid.Item>
        )}

        {outgoingPoints.length > 0 && (
          <Grid.Item full as={Grid} gap={1} className="mb6">
            <Grid.Item full as={H5}>
              Outgoing Transfers
            </Grid.Item>
            <Grid.Item
              full
              as={PointList}
              points={outgoingPoints}
              actions={
                <ActionButtons
                  actions={[
                    {
                      text: 'Cancel',
                      onClick: () => {
                        // TODO: cancel
                        console.log('cancel');
                      },
                    },
                  ]}
                />
              }
              inverted
            />
          </Grid.Item>
        )}

        {multipassPoints.length > 0 && (
          <Grid.Item full as={Grid} gap={1}>
            <Grid.Item full as={H5}>
              Multipasses
            </Grid.Item>
            <Grid.Item full as={PointList} points={multipassPoints} />
          </Grid.Item>
        )}

        {isEclipticOwner && (
          <FooterButton
            detail="You have the authority to create a new Galaxy."
            onClick={() => history.push(ROUTE_NAMES.CREATE_GALAXY)}>
            Create a galaxy
          </FooterButton>
        )}
      </Grid>
    </View>
  );
}
