import React, { useCallback, useState } from 'react';
import { Grid } from 'indigo-react';
import * as ob from 'urbit-ob';
import { azimuth } from 'azimuth-js';

import { usePointCursor } from 'store/pointCursor';
import { usePointCache } from 'store/pointCache';

import * as need from 'lib/need';

import { ForwardButton } from 'components/Buttons';
import NetworkingKeys from 'components/NetworkingKeys';

import { useLocalRouter } from 'lib/LocalRouter';

export default function UrbitOSHome({ manualNetworkSeed }) {
  const { pointCursor } = usePointCursor();
  const { getDetails } = usePointCache();

  const { push, names } = useLocalRouter();

  const point = need.point(pointCursor);
  const details = need.details(getDetails(point));

  const sponsor = ob.patp(details.sponsor);

  const [showKeys, setShowKeys] = useState(false);

  const showSponsor = azimuth.getPointSize(point) !== azimuth.PointSize.Galaxy;
  const toggleShowKeys = useCallback(() => setShowKeys(s => !s), [setShowKeys]);

  const goNetworkingKeys = useCallback(() => push(names.NETWORKING_KEYS), [
    names,
    push,
  ]);

  const goChangeSponsor = useCallback(() => push(names.CHANGE_SPONSOR), [
    push,
    names,
  ]);
  return (
    <>
      <Grid>
        <Grid.Item full className="mv7 f5">
          Network
        </Grid.Item>
        {showSponsor && (
          <>
            <Grid.Divider />
            <Grid.Item
              full
              as={ForwardButton}
              detail="A sponsor finds new peers in your network"
              accessory={<u>Change</u>}
              onClick={goChangeSponsor}>
              <span className="mono">{sponsor}</span>
              <span className="f7 bg-black white p1 ml2 r4">SPONSOR</span>
            </Grid.Item>
          </>
        )}

        <Grid.Divider />
        <Grid.Item full as={ForwardButton} onClick={goNetworkingKeys}>
          Reset Networking Keys
        </Grid.Item>
        <Grid.Divider />
        <Grid.Item
          full
          as={ForwardButton}
          accessory={showKeys ? '▼' : '▲'}
          onClick={toggleShowKeys}>
          View Networking Keys
        </Grid.Item>
        {showKeys && <Grid.Item full as={NetworkingKeys} point={point} />}
      </Grid>
    </>
  );
}
