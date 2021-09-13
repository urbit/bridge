import React, { useEffect, useCallback, useState } from 'react';
import { Grid, Button } from 'indigo-react';
import cn from 'classnames';
import * as azimuth from 'azimuth-js';
import { Icon, Row, StatelessTextInput } from '@tlon/indigo-react';

import { usePointCursor } from 'store/pointCursor';
import { usePointCache } from 'store/pointCache';
import { useWallet } from 'store/wallet';
import { useNetwork } from 'store/network';
import { useRollerStore } from 'store/roller';

import { useLocalRouter } from 'lib/LocalRouter';
import * as need from 'lib/need';
import * as wg from 'lib/walletgen';
import useRoller from 'lib/useRoller';
import { generateUrl } from 'lib/utils/invite';

import { useIssueChild } from 'views/Point/IssueChild';
import View from 'components/View';
import L2BackHeader from 'components/L2/Headers/L2BackHeader';
import Window from 'components/L2/Window/Window';
import HeaderPane from 'components/L2/Window/HeaderPane';
import BodyPane from 'components/L2/Window/BodyPane';
import LoadingOverlay from 'components/L2/LoadingOverlay';
import CopiableWithTooltip from 'components/copiable/CopiableWithTooltip';
import Paginator from 'components/L2/Paginator';
import InlineEthereumTransaction from 'components/InlineEthereumTransaction';

import './Cohort.scss';
import { getStoredInvites } from 'store/storage/roller';
import { ETH_ZERO_ADDR } from 'lib/constants';

const INVITES_PER_PAGE = 7;
const DEFAULT_NUM_INVITES = 5;

export default function InviteCohort() {
  const { pop } = useLocalRouter();
  const { authToken } = useWallet();
  const {
    nextRoll,
    currentL2,
    pendingTransactions,
    invites,
    setInvites,
  } = useRollerStore();
  const { generateInviteCodes, getPendingTransactions } = useRoller();
  const { pointCursor } = usePointCursor();
  const { contracts } = useNetwork();
  const { syncControlledPoints } = usePointCache();

  const point = need.point(pointCursor);
  const _contracts = need.contracts(contracts);

  const [numInvites, setNumInvites] = useState(
    currentL2 ? DEFAULT_NUM_INVITES : 1
  );
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [l1Invite, setL1Invite] = useState(null);

  const { construct, unconstruct, completed, bind } = useIssueChild();

  // Set up the invite spawn if on L1
  useEffect(() => {
    const _authToken = authToken.getOrElse(null);

    const setUpInvite = async () => {
      setLoading(true);
      const possiblePoints = await azimuth.azimuth.getUnspawnedChildren(
        _contracts,
        point
      );

      let invitePoint;
      for (let i = 0; i < possiblePoints.length; i++) {
        const p = possiblePoints[i];
        if (
          !invites.find(({ planet }) => planet === p) &&
          azimuth.azimuth.getPointSize(p) ===
            azimuth.azimuth.PointSize.Planet &&
          (await azimuth.azimuth.getOwner(_contracts, p)) === ETH_ZERO_ADDR
        ) {
          invitePoint = p;
          break;
        }
      }

      if (invitePoint) {
        const { ticket, owner } = await wg.generateTemporaryDeterministicWallet(
          invitePoint,
          _authToken
        );

        construct(invitePoint, owner.keys.address);
        setL1Invite({ ticket, planet: invitePoint });
      } else {
        setError('No available planets');
      }

      setLoading(false);
    };

    if (!currentL2 && _contracts && point && _authToken && showInviteForm) {
      setUpInvite();
    } else {
      unconstruct();
    }
  }, [
    currentL2,
    point,
    _contracts,
    authToken,
    construct,
    showInviteForm,
    unconstruct,
    invites,
  ]);

  useEffect(() => {
    const { available } = getStoredInvites(point);

    if (
      !completed ||
      !l1Invite ||
      available.find(({ planet }) => planet === l1Invite.planet)
    ) {
      return;
    }

    syncControlledPoints();
    setInvites([...invites, l1Invite]);
    setShowInviteForm(false);
    setL1Invite(null);
    unconstruct();
    pop();
  }, [completed]); // eslint-disable-line react-hooks/exhaustive-deps

  const [page, setPage] = useState(0);

  const invitesToDisplay = invites.slice(
    page * INVITES_PER_PAGE,
    (page + 1) * INVITES_PER_PAGE
  );

  const hasPending = Boolean(pendingTransactions.length);
  const hasInvites = Boolean(invites.length);

  const createInvites = useCallback(async () => {
    setLoading(true);
    try {
      await generateInviteCodes(numInvites);
      getPendingTransactions(point);
      pop();
    } catch (error) {
      setError(error);
    } finally {
      setLoading(false);
    }
  }, [generateInviteCodes, numInvites, getPendingTransactions, point, pop]);

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
            <br />
            <span className="timer">{nextRoll}</span>
            <br />
            to get in the next roll.
          </>
        )}
      </>
    );
  };

  const header = (
    <h5>
      You have
      <span className="number-emphasis"> {invites.length} </span>
      Planet Code{invites.length === 1 ? '' : 's'}
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
              {currentL2 ? (
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
              ) : (
                <div className="migration-prompt">
                  ETH fees are very high currently. You can spawn invites for
                  free after{' '}
                  <span className="migrate" onClick={() => null}>
                    {/* TODO: change this to navigate to migration */}
                    migrating this star to L2.
                  </span>
                </div>
              )}
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
              {currentL2 && (
                <Row className="next-roll">
                  <span>Next Roll in</span>
                  <span className="timer">{nextRoll}</span>
                </Row>
              )}
              {currentL2 ? (
                <Button
                  as={'button'}
                  className={`generate-codes ${loading ? 'loading' : ''}`}
                  center
                  solid
                  disabled={loading}
                  onClick={createInvites}>
                  {loading
                    ? 'Generating...'
                    : `Generate Planet Code${
                        currentL2 ? `s (${numInvites})` : ''
                      }`}
                </Button>
              ) : (
                <Grid.Item
                  full
                  as={InlineEthereumTransaction}
                  label="Generate Planet Code"
                  {...bind}
                  onReturn={pop}
                />
              )}
            </div>
          </BodyPane>
        </Window>
        <LoadingOverlay loading={loading} />
      </View>
    );
  }

  const showGenerateButton = !hasPending && !hasInvites;

  return (
    <View
      pop={pop}
      inset
      className="cohort"
      hideBack
      header={<L2BackHeader hideBalance />}>
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
          {showGenerateButton && (
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
              numElements={invites.length}
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
