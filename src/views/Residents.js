import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Grid, H4, HelpText } from 'indigo-react';
import { Just, Nothing } from 'folktale/maybe';
import * as ob from 'urbit-ob';

import View from 'components/View';
import Tabs from 'components/Tabs';
import Crumbs from 'components/Crumbs';
import Sigil from 'components/Sigil';
import Blinky from 'components/Blinky';
import NavHeader from 'components/NavHeader';

import { useLocalRouter } from 'lib/LocalRouter';
import useCurrentPointName from 'lib/useCurrentPointName';
import * as need from 'lib/need';

import { usePointCursor } from 'store/pointCursor';
import { usePointCache } from 'store/pointCache';

const NAMES = {
  REQUESTS: 'REQUESTS',
  ALL: 'ALL',
};

const OPTIONS = [
  { text: 'Requests', value: NAMES.REQUESTS },
  { text: 'All', value: NAMES.ALL },
];

const VIEWS = {
  [NAMES.REQUESTS]: Tab,
  [NAMES.ALL]: Tab,
};

function Tab({ className, points, onAccept, onDecline }) {
  if (Nothing.hasInstance(points)) {
    return <Grid className={className}></Grid>;
  }

  const _points = points.getOrElse([]);

  return (
    <Grid className={className}>
      {_points.length === 0 && (
        <Grid.Item full as={HelpText} className="mt8 t-center">
          {Just.hasInstance(points) ? (
            'No points to display'
          ) : (
            <>
              <Blinky /> Loading...
            </>
          )}
        </Grid.Item>
      )}

      {_points.map(point => (
        <Resident
          key={point}
          point={point}
          onAccept={onAccept}
          onDecline={onDecline}
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
          <Grid.Item
            className="flex-row-r align-center underline green3 pointer"
            cols={[7, 10]}
            onClick={() => onAccept(point)}>
            Accept
          </Grid.Item>
          <Grid.Item
            className="flex-row-r align-center underline red4 pointer"
            cols={[10, 13]}
            onClick={() => onDecline(point)}>
            Decline
          </Grid.Item>
        </>
      )}
      <Grid.Divider />
    </>
  );
}

export default function Residents() {
  const { pop, push, names } = useLocalRouter();
  const name = useCurrentPointName();

  const { pointCursor } = usePointCursor();
  const point = need.point(pointCursor);
  const { getResidents, syncResidents } = usePointCache();

  useEffect(() => {
    syncResidents(point);
  }, [syncResidents, point]);

  const { residents, requests } = getResidents(point);

  const [currentTab, setCurrentTab] = useState(NAMES.ALL);

  const isRequests = useMemo(() => currentTab === NAMES.REQUESTS, [currentTab]);

  const _onAccept = useCallback(
    adoptee =>
      push(names.ADOPT, {
        adoptee,
        denied: false,
      }),
    [push, names]
  );
  const onAccept = isRequests && _onAccept;

  const _onDecline = useCallback(
    adoptee =>
      push(names.ADOPT, {
        adoptee,
        denied: true,
      }),
    [push, names]
  );
  const onDecline = isRequests && _onDecline;

  const points = isRequests ? requests : residents;

  return (
    <View pop={pop} inset>
      <NavHeader>
        <Crumbs routes={[{ text: name, action: pop }, { text: 'Residents' }]} />
      </NavHeader>
      <Grid>
        <Grid.Item full as={H4} className="mt4">
          Residents
        </Grid.Item>
        <Grid.Item
          full
          className="mt1"
          as={Tabs}
          //  Tabs
          views={VIEWS}
          options={OPTIONS}
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          //  Props for tab
          points={points}
          onAccept={onAccept}
          onDecline={onDecline}
        />
      </Grid>
    </View>
  );
}
