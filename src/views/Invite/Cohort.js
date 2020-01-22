import React, { useMemo, useEffect, useCallback, useState } from 'react';
import { Grid, Flex, Button } from 'indigo-react';
import * as ob from 'urbit-ob';
import { Just } from 'folktale/maybe';
import cn from 'classnames';

import { usePointCursor } from 'store/pointCursor';
import { usePointCache } from 'store/pointCache';

import View from 'components/View';
import Tabs from 'components/Tabs';
import BarGraph from 'components/BarGraph';
import MaybeSigil from 'components/MaybeSigil';
import { matchBlinky } from 'components/Blinky';
import { ForwardButton } from 'components/Buttons';
import Chip from 'components/Chip';
import Crumbs from 'components/Crumbs';

import { useLocalRouter } from 'lib/LocalRouter';
import useInvites from 'lib/useInvites';
import * as need from 'lib/need';

import Inviter from 'views/Invite/Inviter';

import { ReactComponent as SearchIcon } from 'assets/search.svg';

function SearchInput({ className, value, onChange }) {
  return (
    <Flex align="center" full className={cn('b b-gray2 b1', className)}>
      <Flex.Item className="p2">
        <SearchIcon />
      </Flex.Item>

      <Flex.Item
        flex={1}
        as={'input'}
        value={value}
        onChange={onChange}
        className="b-none h7"
      />
    </Flex>
  );
}

function CohortMember({ point, pending = false, className }) {
  const { sentInvites } = useInvites(point);
  const patp = useMemo(() => ob.patp(point), [point]);
  const colors = pending ? ['#ee892b', '#FFFFFF'] : ['#000000', '#FFFFFF'];

  const DetailText = useCallback(
    () =>
      pending ? 'Pending' : <> {matchBlinky(sentInvites)} points invited </>,
    [sentInvites]
  );

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
        <Flex.Item className="gray4">
          <DetailText />
        </Flex.Item>
      </Flex.Item>
    </Flex>
  );
}
function CohortList({ acceptedPoints, pendingPoints, className, onlyPending }) {
  const { syncInvites } = usePointCache();

  const [query, setQuery] = useState('');

  useEffect(() => {
    acceptedPoints.map(syncInvites);
  }, [acceptedPoints, syncInvites]);

  const handleChange = useCallback(
    e => {
      setQuery(e.target.value);
      e.preventDefault();
    },
    [setQuery]
  );

  const filterPoints = useCallback(
    points =>
      points.filter(p => {
        const patp = ob.patp(p).slice(1);
        return patp.startsWith(query);
      }),
    [query]
  );

  const _pendingPoints = filterPoints(pendingPoints);
  const _acceptedPoints = filterPoints(acceptedPoints);

  const offset = onlyPending ? 0 : _acceptedPoints.length;

  return (
    <Grid gap={3} className={cn('mt4', className)}>
      <Grid.Item full as={SearchInput} value={query} onChange={handleChange} />
      <>
        {!onlyPending &&
          _acceptedPoints.map((p, idx) => (
            <Grid.Item
              key={p}
              half={(idx % 2) + 1}
              as={CohortMember}
              point={p}
            />
          ))}
        {_pendingPoints.map((p, idx) => (
          <Grid.Item
            key={p}
            half={((offset + idx) % 2) + 1}
            as={CohortMember}
            point={p}
            pending
          />
        ))}
      </>

      {_pendingPoints.length === 0 &&
        (_acceptedPoints.length === 0 || onlyPending) && (
          <Grid.Item full className="p4 t-center">
            {' '}
            No invites accepted yet.
          </Grid.Item>
        )}
    </Grid>
  );
}

export default function InviteCohort() {
  const { pop } = useLocalRouter();

  const { pointCursor } = usePointCursor();
  const point = need.point(pointCursor);

  const {
    acceptedInvites,
    acceptedPoints,
    pendingPoints,
    availableInvites,
    sentInvites,
  } = useInvites(point);

  const [showInviteForm, setShowInviteForm] = useState(false);
  const [tab, setTab] = useState(NAMES.ALL);

  const _acceptedPoints = acceptedPoints.getOrElse([]);
  const _pendingPoints = pendingPoints.getOrElse([]);
  const _pendingInvites = _pendingPoints.length;
  const _acceptedInvites = _acceptedPoints.length;
  const _totalInvites = availableInvites
    .map(a => sentInvites.getOrElse(0) + a)
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
            {_pendingInvites !== 0 && (
              <Flex.Item as={Chip} className="bg-yellow4 white">
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
        {availableInvites.getOrElse(0) !== 0 && !showInviteForm && (
          <Grid.Item
            full
            solid
            center
            as={Button}
            onClick={() => setShowInviteForm(true)}>
            Add Members
          </Grid.Item>
        )}
        {showInviteForm && <Inviter />}

        <Grid.Item
          full
          center
          as={Tabs}
          views={VIEWS}
          options={OPTIONS}
          currentTab={tab}
          onTabChange={setTab}
          acceptedPoints={_acceptedPoints}
          pendingPoints={_pendingPoints}
          onlyPending={tab === NAMES.PENDING}
        />
      </Grid>
    </View>
  );
}
const NAMES = {
  ALL: 'ALL',
  PENDING: 'PENDING',
};

const VIEWS = {
  [NAMES.PENDING]: CohortList,
  [NAMES.ALL]: CohortList,
};

const OPTIONS = [
  { text: 'All', value: NAMES.ALL },
  { text: 'Pending', value: NAMES.PENDING },
];
