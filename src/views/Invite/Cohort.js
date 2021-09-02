import React, { useMemo, useEffect, useCallback, useState } from 'react';
import { Grid, Flex, Button } from 'indigo-react';
import * as ob from 'urbit-ob';
import { Just, Nothing } from 'folktale/maybe';
import cn from 'classnames';

import { usePointCursor } from 'store/pointCursor';
import { usePointCache } from 'store/pointCache';
import { useWallet } from 'store/wallet';

import View from 'components/View';
import MaybeSigil from 'components/MaybeSigil';
import { matchBlinky } from 'components/Blinky';

import { useLocalRouter } from 'lib/LocalRouter';
import useInvites from 'lib/useInvites';
import * as need from 'lib/need';
import * as wg from 'lib/walletgen';

import { ReactComponent as SearchIcon } from 'assets/search.svg';
import CopyButton from 'components/copiable/CopyButton';
import { useNetwork } from 'store/network';
import L2BackHeader from 'components/L2/Headers/L2BackHeader';
import Window from 'components/L2/Window/Window';
import HeaderPane from 'components/L2/Window/HeaderPane';
import { Icon, Row, StatelessTextInput } from '@tlon/indigo-react';
import BodyPane from 'components/L2/Window/BodyPane';
import { useRollerStore } from 'store/roller';
import useRoller from 'lib/useRoller';
import FeeDropdown from 'components/L2/Dropdowns/FeeDropdown';
import LoadingOverlay from 'components/L2/LoadingOverlay';
import { generateUrl } from 'lib/utils/invite';
import CopiableWithTooltip from 'components/copiable/CopiableWithTooltip';
import Paginator from 'components/L2/Paginator';

import './Cohort.scss';
import useInviter from 'lib/useInviter';

const INVITES_PER_PAGE = 7;
const DEFAULT_NUM_INVITES = 5;

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
  const {
    nextRoll,
    currentL2,
    pendingTransactions,
    invites,
  } = useRollerStore();
  const { generateInvites } = useInviter();
  const { generateInviteCodes, getPendingTransactions } = useRoller();

  const { pointCursor } = usePointCursor();
  const point = need.point(pointCursor);

  const [page, setPage] = useState(0);

  const { pendingPoints } = useInvites(point);

  const displayedInvites = currentL2 ? invites : pendingPoints.getOrElse([]);

  const invitesToDisplay = displayedInvites.slice(
    page * INVITES_PER_PAGE,
    (page + 1) * INVITES_PER_PAGE
  );

  const hasPending = Boolean(pendingTransactions.length);
  const hasInvites = Boolean(displayedInvites.length);

  const [numInvites, setNumInvites] = useState(DEFAULT_NUM_INVITES);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createInvites = useCallback(async () => {
    setLoading(true);
    try {
      if (currentL2) {
        const invites = await generateInviteCodes(numInvites);
        console.log('INVITES', invites);
        getPendingTransactions(point);
      } else {
        const invites = await generateInvites(numInvites);
        console.log('INVITES', invites);
      }
      setShowInviteForm(false);
    } catch (error) {
      setError(error);
    } finally {
      setLoading(false);
    }
  }, [
    generateInviteCodes,
    numInvites,
    getPendingTransactions,
    point,
    generateInvites,
    currentL2,
  ]);

  const getContent = () => {
    if (hasInvites) {
      return (
        <>
          <div>
            Be careful who you share these with. Each planet code can only be
            claimed once.
          </div>
          <div style={{ marginTop: 8 }}>
            Once a code has been claimed, the code will automatically disappear.
          </div>
          <div className="invites">
            {invitesToDisplay.map(invite => (
              <div className="invite" key={invite.ticket}>
                <div className="invite-url">
                  {generateUrl(invite.ticket, invite.planet)}
                </div>
                <CopiableWithTooltip
                  text={generateUrl(invite.ticket, invite.planet)}
                  className={cn('copy-invite')}
                />
              </div>
            ))}
          </div>
        </>
      );
    } else if (hasPending) {
      return (
        <>
          Your invite codes are in queue.
          <br />
          Check back in <span className="timer"> {nextRoll}</span>
        </>
      );
    }

    return (
      <>
        You have no planet codes available.
        <br />
        {currentL2 && (
          <>
            Generate your codes in
            <span className="timer"> {nextRoll} </span>
            to get in the next roll.
          </>
        )}
      </>
    );
  };

  const header = (
    <h5>
      You have
      <span className="number-emphasis"> {displayedInvites.length} </span>
      Planet Code{displayedInvites.length === 1 ? '' : 's'}
    </h5>
  );

  if (showInviteForm) {
    return (
      <View
        className="cohort show-invite-form"
        hideBack
        header={<L2BackHeader back={() => setShowInviteForm(false)} />}>
        <Window>
          <HeaderPane>
            <h5>Generate Planet Codes</h5>
          </HeaderPane>
          <BodyPane>
            <div className="upper">
              <Row className="points-input">
                I want to generate
                <StatelessTextInput
                  className="input-box"
                  value={numInvites}
                  maxLength="3"
                  onChange={e =>
                    setNumInvites(Number(e.target.value.replace(/\D/g, '')))
                  }
                />
                planet invite code{numInvites > 1 ? 's' : ''}
              </Row>
              {/* <div>Destination</div>
              <div className="ship-or-address">Ship or ethereum address</div>
              <Dropdown value={dropdownValue}>
                {points.map(point => (
                  <div onClick={selectPoint(point)} className="address">
                    {ob.patp(point)}
                  </div>
                ))}
              </Dropdown> */}
            </div>
            {/* <Inviter /> */}
            <div className="lower">
              <Row className="next-roll">
                <span>{currentL2 ? 'Next Roll in' : 'Transaction Fee'}</span>
                {currentL2 ? (
                  <span className="timer">{nextRoll}</span>
                ) : (
                  <FeeDropdown />
                )}
              </Row>
              <Button
                as={'button'}
                className="generate-codes"
                center
                solid
                onClick={createInvites}>
                Generate Planet Codes ({numInvites})
              </Button>
            </div>
          </BodyPane>
        </Window>
        <LoadingOverlay loading={loading} />
      </View>
    );
  }

  return (
    <View pop={pop} inset className="cohort" hideBack header={<L2BackHeader />}>
      <Window>
        <HeaderPane>
          {!hasInvites ? (
            header
          ) : (
            <Row className="has-invites-header">
              {header}
              <div className="download-csv" onClick={() => null}>
                <Icon icon="Download" />
                <div>CSV</div>
              </div>
            </Row>
          )}
        </HeaderPane>
        <BodyPane>
          <div className={`content ${!hasInvites ? 'center' : ''}`}>
            {getContent()}
          </div>
          {!hasPending && !hasInvites && (
            <Button
              as={'button'}
              className="generate-button"
              center
              solid
              onClick={() => setShowInviteForm(true)}>
              Generate Codes
            </Button>
          )}
          {hasInvites && (
            <Paginator
              page={page}
              numPerPage={INVITES_PER_PAGE}
              numElements={displayedInvites.length}
              goPrevious={() => setPage(page - 1)}
              goNext={() => setPage(page + 1)}
            />
          )}
        </BodyPane>
      </Window>
      {(hasInvites || hasPending) && (
        <Button
          onClick={() => setShowInviteForm(true)}
          className="add-more"
          accessory={<Icon icon="ChevronEast" />}>
          Add More
        </Button>
      )}
    </View>
  );
}
