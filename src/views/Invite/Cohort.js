import React, { useMemo, useEffect, useCallback, useState } from 'react';
import { Grid, Flex, Button } from 'indigo-react';
import * as ob from 'urbit-ob';
import { Just, Nothing } from 'folktale/maybe';
import cn from 'classnames';

import { usePointCursor } from 'store/pointCursor';
import { usePointCache } from 'store/pointCache';
import { useWallet } from 'store/wallet';

import View from 'components/View';
import Tabs from 'components/Tabs';
import BarGraph from 'components/BarGraph';
import MaybeSigil from 'components/MaybeSigil';
import { matchBlinky } from 'components/Blinky';
import Chip from 'components/Chip';
import Crumbs from 'components/Crumbs';

import { useLocalRouter } from 'lib/LocalRouter';
import useInvites from 'lib/useInvites';
import * as need from 'lib/need';
import * as wg from 'lib/walletgen';

import Inviter from 'views/Invite/Inviter';

import { ReactComponent as SearchIcon } from 'assets/search.svg';
import CopyButton from 'components/CopyButton';
import { useSyncDetails } from 'lib/useSyncPoints';
import { useNetwork } from 'store/network';
import NavHeader from 'components/NavHeader';

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

function CohortMember({ point, pending = false, className, ...rest }) {
  const { sentInvites } = useInvites(point);
  const patp = useMemo(() => ob.patp(point), [point]);
  const colors = pending ? ['#ee892b', '#FFFFFF'] : ['#000000', '#FFFFFF'];

  const DetailText = useCallback(
    () =>
      pending ? 'Pending' : <> {matchBlinky(sentInvites)} points invited </>,
    [pending, sentInvites]
  );

  return (
    <Flex justify="between" className={cn('b1 b-gray2', className)} {...rest}>
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
function CohortList({
  acceptedPoints,
  pendingPoints,
  className,
  onlyPending,
  onSelectInvite,
}) {
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
  const selectInvite = useCallback(
    point => () => {
      onSelectInvite(point);
    },
    [onSelectInvite]
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
              onClick={selectInvite(p)}
            />
          ))}
        {_pendingPoints.map((p, idx) => (
          <Grid.Item
            key={p}
            half={((offset + idx) % 2) + 1}
            as={CohortMember}
            point={p}
            pending
            onClick={selectInvite(p)}
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

function hideIf(hider, hidden) {
  return hider ? '●●●●●●●' : hidden;
}

function CohortMemberExpanded({ point, className, ...rest }) {
  const { sentInvites, acceptedInvites } = useInvites(point);
  const { getDetails } = usePointCache();
  const { authToken } = useWallet();
  const { contracts } = useNetwork();
  const details = getDetails(point);
  const { active } = details.getOrElse({});
  const patp = useMemo(() => ob.patp(point), [point]);
  const colors = useMemo(
    () => (!active ? ['#ee892b', '#FFFFFF'] : ['#000000', '#FFFFFF']),
    [active]
  );

  const [code, setCode] = useState(Nothing());
  const [codeVisible, setCodeVisible] = useState(false);

  useEffect(() => {
    const fetchWallet = async () => {
      const _authToken = authToken.getOrElse(null);
      const _details = details.getOrElse(null);
      const _contracts = contracts.getOrElse(null);
      if (
        !_authToken ||
        !_details ||
        _details.active ||
        !_contracts ||
        !codeVisible
      ) {
        setCode(Nothing());
        return;
      }
      const { ticket, owner } = await wg.generateTemporaryDeterministicWallet(
        point,
        _authToken
      );

      if (owner.keys.address !== _details.transferProxy) {
        setCode(Just(null));
      } else {
        setCode(Just(ticket));
      }
    };
    fetchWallet();
  }, [authToken, codeVisible, contracts, details, point]);

  useEffect(() => {
    setCodeVisible(false);
  }, [point]);

  return (
    <Grid justify="between" className={cn('b1 b-gray2', className)} {...rest}>
      <Grid.Item rows={[1, 4]} cols={[1, 4]} className="h10 w10">
        <MaybeSigil patp={Just(patp)} size={64} colors={colors} />
      </Grid.Item>

      <Grid.Item cols={[4, 13]} className="mono mt-auto ">
        {patp}
      </Grid.Item>

      {!active && (
        <>
          <Grid.Item
            cols={[4, 13]}
            className="mt-auto mb1 f6 gray4"
            as={Flex}
            col>
            Invite Code
          </Grid.Item>
          <Grid.Item cols={[4, 10]} className="mb-auto mt1 f6 gray4">
            {(code.getOrElse(true) === null &&
              'This invite code cannot be recovered') ||
              hideIf(!codeVisible, matchBlinky(code))}
          </Grid.Item>
          {!codeVisible && (
            <Grid.Item
              cols={[10, 13]}
              className="mh-auto f6 underline pointer"
              onClick={() => setCodeVisible(true)}>
              Show
            </Grid.Item>
          )}
          {codeVisible && code.getOrElse('') !== null && (
            <Grid.Item
              className="mh-auto f6 t-right"
              cols={[10, 13]}
              as={CopyButton}
              text={code.getOrElse('')}
            />
          )}
        </>
      )}

      {active && (
        <>
          <Grid.Item
            cols={[4, 13]}
            className="mt-auto mb1 f6 gray4"
            as={Flex}
            col>
            {matchBlinky(sentInvites)} invites sent
          </Grid.Item>
          <Grid.Item
            cols={[4, 13]}
            className="mb-auto mt1 f6 gray4"
            as={Flex}
            col>
            {matchBlinky(acceptedInvites)} invites accepted
          </Grid.Item>
        </>
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

  const [selectedInvite, _setSelectedInvite] = useState();

  useSyncDetails([..._acceptedPoints, ..._pendingPoints]);

  const setSelectedInvite = useCallback(
    p => _setSelectedInvite(old => (old === p ? null : p)),
    []
  );

  return (
    <View pop={pop} inset>
      <NavHeader>
        <Crumbs
          className="mb1"
          routes={[
            { text: ob.patp(point), action: () => pop() },
            { text: 'Invite Group' },
          ]}
        />
      </NavHeader>
      <Grid gap={3}>
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

        {true && (
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
            onSelectInvite={setSelectedInvite}
          />
        )}
        {selectedInvite && (
          <Grid.Item
            full
            center
            as={CohortMemberExpanded}
            pending
            point={selectedInvite}
            onBack={() => setSelectedInvite(null)}
          />
        )}
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
