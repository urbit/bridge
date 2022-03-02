import { useCallback, useState } from 'react';
import { Button } from 'indigo-react';
import { Icon, Row, Box, LoadingSpinner, H3 } from '@tlon/indigo-react';

import { useRollerStore } from 'store/rollerStore';
import { useLocalRouter } from 'lib/LocalRouter';
import { generateUrl, generateUrlAbbreviation } from 'lib/utils/invite';
import { INVITES_PER_PAGE } from 'lib/constants';
import { useTimerStore } from 'store/timerStore';
import { Invite } from 'lib/types/Invite';
import { ddmmmYYYY } from 'lib/utils/date';

import View from 'components/View';
import L2BackHeader from 'components/L2/Headers/L2BackHeader';
import Window from 'components/L2/Window/Window';
import HeaderPane from 'components/L2/Window/HeaderPane';
import BodyPane from 'components/L2/Window/BodyPane';
import CopiableWithTooltip from 'components/copiable/CopiableWithTooltip';
import Paginator from 'components/L2/Paginator';

import './Cohort.scss';
import { useInviteStore } from './useInvites';
import { CSVButton } from './CSVButton';

export default function InviteCohort() {
  const { names, pop, push } = useLocalRouter();
  const { point, pendingTransactions, nextQuotaTime } = useRollerStore();

  const { nextRoll } = useTimerStore();

  const { invites, inviteJobs } = useInviteStore();
  const currentL2 = Boolean(point.isL2Spawn);

  // TODO: do we need to read this error? currently unused
  const [page, setPage] = useState(0);

  const invitePoints = invites[point.value];
  const inviteJob = inviteJobs[point.value];

  const invitesToDisplay = invitePoints.slice(
    page * INVITES_PER_PAGE,
    (page + 1) * INVITES_PER_PAGE
  );

  const hasPending = Boolean(pendingTransactions.length);
  const hasInvites = Boolean(invitePoints.length);

  const goNextPage = useCallback(() => {
    setPage(page + 1);
  }, [page]);

  const getContent = () => {
    if (hasInvites) {
      return (
        <>
          <Box>
            Be careful who you share these with. Each invite code can only be
            claimed once. Each invite code contains one planet.
          </Box>
          <Box style={{ marginTop: 8 }}>
            Once a code has been claimed, the code will automatically disappear.
          </Box>
          <Box className="invites">
            {invitesToDisplay.map((invite: Invite) => (
              <Box className="invite" key={invite.planet}>
                <Box
                  className={`invite-url ${invite.ticket ? '' : 'shortened'}`}>
                  {generateUrlAbbreviation(invite.ticket, invite.planet)}
                </Box>
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
              </Box>
            ))}
          </Box>
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

  const header = () => {
    if (inviteJob?.status === 'generating') {
      return (
        <Row alignItems="center">
          <LoadingSpinner dark />
          <H3 ml={2}>
            Checking and Updating Invite #{inviteJob.generatingNum}...
          </H3>
        </Row>
      );
    }

    return (
      <h5>
        You have
        <span className="number-emphasis"> {invitePoints.length} </span>
        Invite Code{invitePoints.length === 1 ? '' : 's'}
      </h5>
    );
  };

  const showGenerateButton = !hasPending && !hasInvites && point.canSpawn;
  const showAddMoreButton =
    (hasInvites || hasPending) && point.canSpawn && point.l2Quota > 0;

  return (
    <View
      pop={pop}
      inset
      className="cohort"
      hideBack
      header={<L2BackHeader hideBalance={point.isL2Spawn} />}>
      <Window>
        <HeaderPane>
          {!hasInvites ? (
            header()
          ) : (
            <Row className="has-invites-header">
              {header()}
              <CSVButton
                point={point}
                invitesUpdating={inviteJob?.status === 'generating'}
              />
            </Row>
          )}
        </HeaderPane>
        <BodyPane>
          <Box className={`content ${!hasInvites ? 'center' : ''}`}>
            {getContent()}
          </Box>
          {showGenerateButton && (
            // Ignoring deprecated component
            //@ts-ignore
            <Button
              className="generate-button ph4"
              center
              onClick={() => push(names.GENERATE_INVITES)}>
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
      {showAddMoreButton ? (
        <Button
          onClick={() => push(names.GENERATE_INVITES)}
          className="add-more"
          //@ts-ignore
          accessory={<Icon icon="ChevronEast" />}>
          Add More
        </Button>
      ) : point.l2Quota < 1 ? (
        <Box className="invite-limit-message">
          You have hit your weekly invite limit. You will be able to generate
          another
          <strong>{` ${point.l2Allowance}`}</strong> invites on
          <strong>{` ${ddmmmYYYY(nextQuotaTime)}`}</strong>.
        </Box>
      ) : null}
    </View>
  );
}
