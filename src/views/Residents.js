import React, { useState, useEffect, useCallback } from 'react';
import { Grid, H4 } from 'indigo-react';
import { Nothing } from 'folktale/maybe';
import * as ob from 'urbit-ob';

import View from 'components/View';
import Tabs from 'components/Tabs';
import Crumbs from 'components/Crumbs';
import Sigil from 'components/Sigil';

import { useLocalRouter } from 'lib/LocalRouter';
import useCurrentPointName from 'lib/useCurrentPointName';
import { useResidents } from 'lib/useResidents';
import * as need from 'lib/need';

import { usePointCursor } from 'store/pointCursor';

const NAMES = {
  REQUESTS: 'REQUESTS',
  ALL: 'ALL',
};

const OPTIONS = [
  { text: 'Requests', value: NAMES.REQUESTS },
  { text: 'All', value: NAMES.ALL },
];

const VIEWS = {
  [NAMES.REQUESTS]: Requests,
  [NAMES.ALL]: AllResidents,
};

function Requests({ className }) {
  const onThing = () => {};
  const { pointCursor } = usePointCursor();
  const point = need.point(pointCursor);
  const { requests, syncRequests } = useResidents(point);
  useEffect(() => {
    syncRequests();
  }, [syncRequests]);

  if (Nothing.hasInstance(requests)) {
    return (
      <Grid className={className}>
        <Grid.Item full>Loading...</Grid.Item>
      </Grid>
    );
  }

  const _requests = requests.getOrElse([]);

  return (
    <Grid className={className}>
      {_requests.map(point => (
        <Resident
          key={point}
          point={point}
          onAccept={onThing}
          onDecline={onThing}
        />
      ))}
    </Grid>
  );
}

function Resident({ point, onAccept, onDecline }) {
  const patp = ob.patp(point);
  const sigilSize = 50;

  const isRequest = onAccept && onDecline;

  return (
    <>
      <Grid.Item className="flex-row justify-center align-center" cols={[1, 3]}>
        <div
          style={{
            display: 'inline-block',
            height: `${sigilSize}px`,
            width: `${sigilSize}px`,
          }}>
          <Sigil patp={patp} size={25} colors={['#FFFFFF', '#000000']} />
        </div>
      </Grid.Item>
      <Grid.Item className="flex-row align-center" cols={[3, 6]}>
        {patp}{' '}
      </Grid.Item>
      {isRequest && (
        <>
          <Grid.Item className="flex-row align-center underline" cols={[7, 10]}>
            Accept
          </Grid.Item>
          <Grid.Item
            className="flex-row align-center underline"
            cols={[10, 13]}>
            Decline
          </Grid.Item>
        </>
      )}
      <Grid.Divider />
    </>
  );
}

function AllResidents({ className }) {
  const { pointCursor } = usePointCursor();
  const point = need.point(pointCursor);
  const { syncResidents, residents } = useResidents(point);
  useEffect(() => {
    syncResidents();
  }, [syncResidents]);

  if (Nothing.hasInstance(residents)) {
    return (
      <Grid className={className}>
        <Grid.Item full>Loading...</Grid.Item>
      </Grid>
    );
  }

  const _residents = residents.getOrElse([]);

  return (
    <Grid className={className}>
      {_residents.map(point => (
        <Resident key={point} point={point} />
      ))}
    </Grid>
  );
}

export default function Residents() {
  const { pop } = useLocalRouter();
  const name = useCurrentPointName();

  // const { pointCursor } = usePointCursor();

  const [currentTab, setCurrentTab] = useState(NAMES.ALL);

  const [req, selectRequest] = useState();

  return (
    <View pop={pop}>
      <Grid>
        <Grid.Item
          full
          as={Crumbs}
          routes={[{ text: name, action: pop }, { text: 'Residents' }]}
        />
        <Grid.Item full as={H4} className="mt4">
          Residents
        </Grid.Item>
        <Grid.Item
          full
          className="mt1"
          as={Tabs}
          views={VIEWS}
          options={OPTIONS}
          currentTab={currentTab}
          onTabChange={setCurrentTab}
        />
      </Grid>
    </View>
  );
}
