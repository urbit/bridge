import React, { useCallback, useEffect, useMemo } from 'react';
import { Just, Nothing, Result } from 'folktale/maybe';
import { Grid, H5, HelpText, LinkButton, Flex } from 'indigo-react';
import { get } from 'lodash';

import { useHistory } from 'store/history';
import { useWallet } from 'store/wallet';
import { usePointCache } from 'store/pointCache';
import { usePointCursor } from 'store/pointCursor';
import { useStarReleaseCache } from 'store/starRelease';

import * as need from 'lib/need';
import { isZeroAddress, abbreviateAddress } from 'lib/wallet';
import useIsEclipticOwner from 'lib/useIsEclipticOwner';
import { useSyncKnownPoints, useSyncOwnedPoints } from 'lib/useSyncPoints';
import useRejectedIncomingPointTransfers from 'lib/useRejectedIncomingPointTransfers';
import pluralize from 'lib/pluralize';
import newGithubIssueUrl from 'new-github-issue-url';

import View from 'components/View';
import Blinky from 'components/Blinky';
import Passport from 'components/Passport';
import Footer from 'components/Footer';
import { ForwardButton } from 'components/Buttons';
import CopiableAddress from 'components/CopiableAddress';
import NavHeader from 'components/NavHeader';

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
  const { syncStarReleaseDetails, starReleaseDetails } = useStarReleaseCache();

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
    if (
      Nothing.hasInstance(maybeOutgoingPoints) ||
      Nothing.hasInstance(starReleaseDetails)
    ) {
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
              maybeOutgoingPoints.value.length === 0 &&
              starReleaseDetails.value.total === 0
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
    starReleaseDetails,
  ]);

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
  const outgoingPoints = maybeOutgoingPoints.getOrElse([]);

  const allPoints = [
    ...ownedPoints.filter(p => !outgoingPoints.includes(p)),
    ...managingPoints,
    ...votingPoints,
    ...spawningPoints,
  ];

  const displayEmptyState =
    !loading && incomingPoints.length === 0 && allPoints.length === 0;

  const starReleasing = starReleaseDetails
    .map(s => s.total > 0)
    .getOrElse(false);

  useEffect(() => {
    syncStarReleaseDetails();
  }, [syncStarReleaseDetails]);
  // sync display details for known points
  useSyncKnownPoints([
    ...ownedPoints,
    ...incomingPoints,
    ...managingPoints,
    ...votingPoints,
    ...spawningPoints,
  ]);

  useSyncOwnedPoints(ownedPoints);

  const goCreateGalaxy = useCallback(() => push(names.CREATE_GALAXY), [
    names.CREATE_GALAXY,
    push,
  ]);

  const goStarRelease = useCallback(() => push(names.STAR_RELEASE), [
    names.STAR_RELEASE,
    push,
  ]);

  //  if we got an error result, we should display it, instead of showing
  //  a potentially inaccurately empty point list.
  //
  if (
    Just.hasInstance(controlledPoints) &&
    controlledPoints.value.matchWith({
      Error: e => true,
      Ok: v => false,
    })
  ) {
    const url = newGithubIssueUrl({
      user: 'urbit',
      repo: 'bridge',
      title: controlledPoints.value.value,
      body: `<!-- Please provide some context. Do you have Metamask installed? What login method did you use? -->`,
    });
    return (
      <View inset>
        <Grid>
          <Grid.Item full as={HelpText} className="mt8 t-center">
            {controlledPoints.value.value}
            <br />
            Try reloading the page. If this problem persists, please{' '}
            <a href={url}>file an issue on GitHub</a>.
          </Grid.Item>
        </Grid>
      </View>
    );
  }

  if (
    loading ||
    (allPoints.length === 1 &&
      incomingPoints.length === 0 &&
      outgoingPoints.length === 0 &&
      !starReleasing)
  ) {
    return (
      <View inset>
        <Grid>
          <Grid.Item full as={HelpText} className="mt8 t-center">
            <Blinky /> Loading...
          </Grid.Item>
        </Grid>
      </View>
    );
  }

  return (
    <View inset pop={pop} hideBack>
      <NavHeader>
        <CopiableAddress
          text={address}
          className="f6 mono gray4 mb4 us-none pointer">
          {abbreviateAddress(address)}
        </CopiableAddress>
      </NavHeader>
      <Grid>
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
              {pluralize(allPoints.length, 'ID')}
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
            {starReleasing && (
              <>
                <Grid.Item
                  full
                  as={ForwardButton}
                  detail="You have points being released"
                  onClick={goStarRelease}>
                  View Star Release
                </Grid.Item>
                <Grid.Divider />
              </>
            )}
          </Grid>
        </Footer>
      </Grid>
    </View>
  );
}
