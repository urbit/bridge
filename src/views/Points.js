import React from 'react';
import { Just, Nothing } from 'folktale/maybe';
import { H1, H2, P, Grid } from 'indigo-react';

import { ROUTE_NAMES } from 'lib/routeNames';
import { isZeroAddress } from 'lib/wallet';
import useIsEclipticOwner from 'lib/useIsEclipticOwner';
import { useSyncKnownPoints } from 'lib/useSyncPoints';

import { useHistory } from 'store/history';
import { useWallet } from 'store/wallet';
import { usePointCache } from 'store/pointCache';

import View from 'components/View';
import { ForwardButton } from 'components/Buttons';
import useLifecycle from 'lib/useLifecycle';

//TODO new component
import { usePointCursor } from 'store/pointCursor';
import * as ob from 'urbit-ob';
const PointList = function(props) {
  const { setPointCursor } = usePointCursor();
  const history = useHistory();
  const { points, loading } = props;

  return points.length === 0 ? (
    <p>{loading ? 'Loading...' : 'No points to display'}</p>
  ) : (
    <>
      {points.map(point => (
        <P
          key={point}
          onClick={() => {
            setPointCursor(Just(point));
            history.push(ROUTE_NAMES.POINT);
          }}>
          {ob.patp(point)}
        </P>
      ))}
    </>
  );
};

const matchArray = obj =>
  obj.matchWith({ Nothing: () => [], Just: p => p.value });

const hasTransferProxy = (details, point) =>
  !isZeroAddress(details.transferProxy);

export default function Points() {
  const { wallet } = useWallet();
  const history = useHistory();
  const {
    getControlledPoints,
    syncControlledPoints,
    getDetails,
  } = usePointCache();
  const {
    ownedPoints,
    incomingPoints,
    managingPoints,
    votingPoints,
    spawningPoints,
  } = getControlledPoints(wallet);
  const isEclipticOwner = useIsEclipticOwner();

  const owned = matchArray(ownedPoints);
  const incoming = matchArray(incomingPoints);
  const managing = matchArray(managingPoints);
  const voting = matchArray(votingPoints);
  const spawning = matchArray(spawningPoints);

  // sync controlled points on mount
  useLifecycle(() => {
    syncControlledPoints();
  });

  // sync display details for known points
  useSyncKnownPoints([
    ...owned,
    ...incoming,
    ...managing,
    ...voting,
    ...spawning,
  ]);

  const loading = Nothing.hasInstance(ownedPoints);

  const outgoing = ownedPoints.filter(point =>
    getDetails(point).matchWith({
      Nothing: () => false,
      Just: p => hasTransferProxy(p.value),
    })
  );

  return (
    <View>
      <H1>Points</H1>

      <P>
        A point is an identity on the Ethereum blockchain. Points declare keys
        for ships on the Arvo network.
      </P>

      <Grid>
        <Grid.Divider />
        <Grid.Item full>
          <ForwardButton
            detail="View a point on Azimuth"
            onClick={() => history.push(ROUTE_NAMES.VIEW_POINT)}>
            View a point
          </ForwardButton>
        </Grid.Item>
        <Grid.Divider />
        {isEclipticOwner && (
          <>
            <Grid.Item full>
              <ForwardButton
                detail="You have the authority to create a new Galaxy."
                onClick={() => history.push(ROUTE_NAMES.CREATE_GALAXY)}>
                Create a galaxy
              </ForwardButton>
            </Grid.Item>
            <Grid.Divider />
          </>
        )}
      </Grid>

      {incoming.length > 0 && (
        <>
          <H2>Incoming Transfers</H2>
          <P>
            You do not own these points until you accept the incoming transfer.
            You may reject any incoming transfers.
          </P>
          <PointList routeHandler={history.push} points={incoming} />
        </>
      )}

      {outgoing.length > 0 && (
        <>
          <H2>Outgoing Transfers</H2>
          <P>
            You own these points until the recipient accepts the incoming
            transfer. You may cancel the transfer until accepted.
          </P>
          <PointList routeHandler={history.push} points={outgoing} />
        </>
      )}

      <H2>Your Points</H2>

      <PointList routeHandler={history.push} points={owned} loading={loading} />

      {managing.length > 0 && (
        <>
          <H2>You Are a Management Proxy For</H2>
          <P>
            You can configure or set network keys and conduct sponsorship
            related operations for these points.
          </P>
          <PointList routeHandler={history.push} points={managing} />
        </>
      )}

      {voting.length > 0 && (
        <>
          <H2>You Are a Voting Proxy For</H2>
          <P>
            Since you are part of the Galactic Senate, you can cast votes on new
            Azimuth proposals on behalf of these points.
          </P>
          <PointList routeHandler={history.push} points={voting} />
        </>
      )}

      {spawning.length > 0 && (
        <>
          <H2>You Are a Spawn Proxy For</H2>
          <P>You can create new child points under these points.</P>
          <PointList routeHandler={history.push} points={spawning} />
        </>
      )}
    </View>
  );
}
