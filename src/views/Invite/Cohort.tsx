import React, { useEffect, useCallback, useMemo, useState } from 'react';
import { Grid, Button } from 'indigo-react';
import * as azimuth from 'azimuth-js';
import {
  Icon,
  Row,
  StatelessTextInput,
  Box,
  LoadingSpinner,
} from '@tlon/indigo-react';

import { usePointCache } from 'store/pointCache';
import { useWallet } from 'store/wallet';
import { useNetwork } from 'store/network';
import { useRollerStore } from 'store/rollerStore';

import { useLocalRouter } from 'lib/LocalRouter';
import * as need from 'lib/need';
import useRoller from 'lib/useRoller';
import {
  generateUrl,
  generateUrlAbbreviation,
  generateCsvLine,
  generateCsvName,
} from 'lib/utils/invite';

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
import {
  DEFAULT_NUM_INVITES,
  ETH_ZERO_ADDR,
  INVITES_PER_PAGE,
  DEFAULT_CSV_NAME,
} from 'lib/constants';
import { isPlanet } from 'lib/utils/point';
import { generateInviteWallet } from 'lib/utils/roller';
import { useTimerStore } from 'store/timerStore';
import { Invite } from 'lib/types/Invite';

interface L1Invite {
  ticket: string;
  planet: number;
}

export default function InviteCohort() {
  const { pop }: any = useLocalRouter();
  const { authToken }: any = useWallet();
  const {
    point,
    pendingTransactions,
    invites,
    inviteGeneratingNum,
    setInviteGeneratingNum,
    setInvites,
  } = useRollerStore();

  const { nextRoll } = useTimerStore();

  const {
    ls,
    generateInviteCodes,
    getPendingTransactions,
    getInvites,
  } = useRoller();
  const { contracts }: any = useNetwork();
  const { syncControlledPoints }: any = usePointCache();
  const currentL2 = Boolean(point.isL2Spawn);

  const _contracts = need.contracts(contracts);

  const [numInvites, setNumInvites] = useState(
    currentL2 ? DEFAULT_NUM_INVITES : 1
  );
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [l1Invite, setL1Invite] = useState<L1Invite | null>(null);
  const [page, setPage] = useState(0);

  const { construct, unconstruct, completed, bind } = useIssueChild();
  const invitePoints: Invite[] = useMemo(() => invites[point.value] || [], [
    invites,
    point,
  ]);

  // Set up the invite spawn if on L1
  useEffect(() => {
    const _authToken = authToken.getOrElse(null);

    if (!_authToken) {
      return;
    }

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
          !invitePoints.find(({ planet }) => planet === p) &&
          isPlanet(p) &&
          (await azimuth.azimuth.getOwner(_contracts, p)) === ETH_ZERO_ADDR
        ) {
          invitePoint = p;
          break;
        }
      }

      if (invitePoint) {
        setInviteGeneratingNum(1);
        const { ticket, inviteWallet } = await generateInviteWallet(
          invitePoint,
          _authToken
        );

        construct(invitePoint, inviteWallet.ownership.keys.address);
        setL1Invite({ ticket, planet: invitePoint });
      } else {
        setError('No available planets');
      }

      setLoading(false);
    };

    if (!currentL2 && _contracts && point && _authToken && showInviteForm) {
      setUpInvite();
    } else if (!currentL2 && !showInviteForm) {
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
    invitePoints,
    setInviteGeneratingNum,
  ]);

  useEffect(() => {
    const storedInvites = getStoredInvites(ls);

    if (
      !currentL2 ||
      !completed ||
      !l1Invite ||
      storedInvites[l1Invite.planet]
    ) {
      return;
    }

    syncControlledPoints();
    setInvites(point.value, [
      ...invitePoints,
      { ...l1Invite, hash: '', owner: '' },
    ]);
    setShowInviteForm(false);
    setL1Invite(null);
    unconstruct();
    pop();
  }, [completed, currentL2, point]); // eslint-disable-line react-hooks/exhaustive-deps

  const invitesToDisplay = invitePoints.slice(
    page * INVITES_PER_PAGE,
    (page + 1) * INVITES_PER_PAGE
  );

  const hasPending = Boolean(pendingTransactions.length);
  const hasInvites = Boolean(invitePoints.length);

  const createInvites = useCallback(async () => {
    setLoading(true);
    try {
      await generateInviteCodes(numInvites);
      getPendingTransactions();
      pop();
    } catch (error) {
      // TODO: error is not used anywhere on the UI
      setError(error as string);
    } finally {
      setLoading(false);
      setInviteGeneratingNum(0);
    }
  }, [
    generateInviteCodes,
    numInvites,
    getPendingTransactions,
    pop,
    setInviteGeneratingNum,
  ]);

  const downloadCsv = useCallback(() => {
    const generateAndDownload = async () => {
      setLoading(true);
      const invites = await getInvites();
      if (invites) {
        const csv = invites.reduce(
          (csvData, { ticket, planet }, ind) =>
            (csvData += generateCsvLine(ind, ticket, planet)),
          'Number,Planet,Invite URL,Point,Ticket\n'
        );
        const hiddenElement = document.createElement('a');
        hiddenElement.href = `data:text/csv;charset=utf-8,${encodeURIComponent(
          csv
        )}`;
        hiddenElement.target = '_blank';

        //provide the name for the CSV file to be downloaded
        hiddenElement.download = generateCsvName(
          DEFAULT_CSV_NAME,
          point.patp?.slice(1) || 'bridge'
        );
        hiddenElement.click();
      } else {
        setError('There was an error creating the CSV');
      }
      setLoading(false);
      setInviteGeneratingNum(0);
    };
    generateAndDownload();
  }, [getInvites, setError, setLoading, setInviteGeneratingNum, point]);

  const goNextPage = useCallback(() => {
    setPage(page + 1);
  }, [page]);

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
            {invitesToDisplay.map((invite: Invite) => (
              <div className="invite" key={invite.planet}>
                <div
                  className={`invite-url ${invite.ticket ? '' : 'shortened'}`}>
                  {generateUrlAbbreviation(invite.ticket, invite.planet)}
                </div>
                {invite.ticket ? (
                  <CopiableWithTooltip
                    text={generateUrl(invite.ticket, invite.planet)}
                    className="copy-invite"
                  />
                ) : (
                  <Box className="ticket-loader">
                    <LoadingSpinner
                      foreground="white"
                      background="rgba(0,0,0,0.3)"
                    />
                  </Box>
                )}
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
        {currentL2 && point.canSpawn && (
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
      <span className="number-emphasis"> {invitePoints.length} </span>
      Planet Code{invitePoints.length === 1 ? '' : 's'}
    </h5>
  );

  if (showInviteForm) {
    return (
      <View
        pop={() => setShowInviteForm(false)}
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
                    maxLength={3}
                    onChange={e => {
                      const target = e.target as HTMLInputElement;
                      setNumInvites(Number(target.value.replace(/\D/g, '')));
                    }}
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
                  disabled={loading}
                  center
                  onClick={createInvites}>
                  {loading
                    ? `Generating ${numInvites} invites...`
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

  const showGenerateButton = !hasPending && !hasInvites && point.canSpawn;
  const showAddMoreButton = (hasInvites || hasPending) && point.canSpawn;
  const generatingCodesText = `Generating invite code ${inviteGeneratingNum} of ${invitePoints.length}...`;

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
              <Row className="download-csv" onClick={downloadCsv}>
                <Icon icon="Download" />
                <div>CSV</div>
              </Row>
            </Row>
          )}
        </HeaderPane>
        <BodyPane>
          <div className={`content ${!hasInvites ? 'center' : ''}`}>
            {getContent()}
          </div>
          {showGenerateButton && (
            <Button
              className="generate-button ph4"
              center
              onClick={() => setShowInviteForm(true)}>
              Generate Codes
            </Button>
          )}
          {hasInvites && (
            <Paginator
              page={page}
              numPerPage={INVITES_PER_PAGE}
              numElements={invitePoints.length}
              goPrevious={() => setPage(page - 1)}
              goNext={goNextPage}
            />
          )}
        </BodyPane>
      </Window>
      {showAddMoreButton && (
        <Button
          onClick={() => setShowInviteForm(true)}
          className="add-more"
          accessory={<Icon icon="ChevronEast" />}>
          Add More
        </Button>
      )}
      <LoadingOverlay loading={loading} text={generatingCodesText} />
    </View>
  );
}
