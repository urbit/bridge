import React, { useMemo, useEffect, useCallback, useState } from 'react';
import { Grid, Flex, Input } from 'indigo-react';
import * as ob from 'urbit-ob';
import { Just } from 'folktale/maybe';
import cn from 'classnames';

import { usePointCursor } from 'store/pointCursor';
import { usePointCache } from 'store/pointCache';

import View from 'components/View';
import BarGraph from 'components/BarGraph';
import InviteSigilList from 'components/InviteSigilList';
import MaybeSigil from 'components/MaybeSigil';
import { matchBlinky } from 'components/Blinky';
import Chip from 'components/Chip';
import Crumbs from 'components/Crumbs';

import { useLocalRouter } from 'lib/LocalRouter';
import useInvites from 'lib/useInvites';
import * as need from 'lib/need';

import { ReactComponent as SearchIcon } from 'assets/search.svg';

function PartyItem({ point, className }) {
  const { sentInvites } = useInvites(point);
  const patp = useMemo(() => ob.patp(point), [point]);
  const colors = ['#000000', '#FFFFFF'];

  return (
    <Flex justify="between" className={cn('b1 b-gray2', className)}>
      <Flex.Item className="w9 h9">
        <MaybeSigil patp={Just(patp)} size={64} colors={colors} />
      </Flex.Item>

      <Flex.Item
        flex={1}
        justify="evenly"
        as={Flex}
        col
        className="mono f6 ph4">
        <Flex.Item>{patp}</Flex.Item>
        <Flex.Item>{matchBlinky(sentInvites)} points invited</Flex.Item>
      </Flex.Item>
    </Flex>
  );
}
function PartyList({ points, className }) {
  const { syncInvites } = usePointCache();

  const [query, setQuery] = useState('');

  useEffect(() => {
    points.map(syncInvites);
  }, [points, syncInvites]);

  const handleChange = useCallback(e => {
    setQuery(e.target.value);
    e.preventDefault();
  });

  const visiblePoints = useMemo(
    () =>
      points.filter(p => {
        const patp = ob.patp(p).slice(1);
        return patp.startsWith(query);
      }),
    [query, points]
  );

  return (
    <Grid gap={3} className={cn('mt1', className)}>
      <Grid.Item align="center" full as={Flex} className="b b-gray2 b1">
        <Flex.Item>
          <SearchIcon className="p2" />
        </Flex.Item>

        <Flex.Item
          flex={1}
          as={'input'}
          value={query}
          onChange={handleChange}
          className="b-none"
        />
      </Grid.Item>
      <>
        {visiblePoints.map((p, idx) => (
          <Grid.Item key={p} half={(idx % 2) + 1} as={PartyItem} point={p} />
        ))}
      </>
    </Grid>
  );
}

export default function ShowParty() {
  const { pop, push, names } = useLocalRouter();

  const { pointCursor } = usePointCursor();
  const point = need.point(pointCursor);

  const {
    acceptedInvites,
    acceptedPoints,
    pendingPoints,
    availableInvites,
    sentInvites,
  } = useInvites(point);

  const _acceptedPoints = acceptedPoints.getOrElse([]);
  const _pendingPoints = pendingPoints.getOrElse([]);
  const _pendingInvites = _pendingPoints.length;
  const _acceptedInvites = _acceptedPoints.length;
  const _totalInvites = availableInvites
    .map(a => sentInvites.getOrElse(0) + a + _acceptedInvites)
    .getOrElse(0);

  return (
    <View pop={pop} inset>
      <Grid gap={3}>
        <Grid.Item
          full
          as={Crumbs}
          className="mb1"
          routes={[
            { text: ob.patp(point), action: () => pop() },
            { text: 'Invite Group' },
          ]}
        />

        <Grid.Item full>Invite Group</Grid.Item>
        <Grid.Item full>
          <Flex align="center">
            <Flex.Item>
              {_acceptedInvites} / {_totalInvites}
            </Flex.Item>
            {_pendingInvites && (
              <Flex.Item as={Chip} color="yellow">
                {_pendingInvites} pending
              </Flex.Item>
            )}
          </Flex>
        </Grid.Item>
        <Grid.Item
          full
          as={BarGraph}
          available={availableInvites}
          sent={sentInvites}
          accepted={acceptedInvites}
        />
        <Grid.Item
          full
          as={InviteSigilList}
          pendingPoints={pendingPoints}
          acceptedPoints={acceptedPoints}
        />
        <Grid.Item full as={PartyList} points={_acceptedPoints} />
      </Grid>
    </View>
  );
}
