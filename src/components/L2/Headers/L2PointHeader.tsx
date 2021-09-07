import React, { useEffect, useCallback } from 'react';
import { Box, Row } from '@tlon/indigo-react';

import useRoller from 'lib/useRoller';
import { useHistory } from 'store/history';
import { ReactComponent as InviteIcon } from 'assets/invite.svg';
import { ReactComponent as HistoryIcon } from 'assets/history.svg';
import AccountsDropdown from '../Dropdowns/AccountsDropdown';
import { useRollerStore } from 'store/roller';

import './L2PointHeader.scss';
import { isDevelopment } from 'lib/flags';

export interface L2PointHeaderProps {
  numInvites: number;
  hideTimer: boolean;
  hideInvites: boolean;
}

const L2PointHeader = ({
  hideTimer = false,
  hideInvites = false,
  numInvites = 0,
}: L2PointHeaderProps) => {
  const { config } = useRoller();
  const { nextRoll, currentL2, pendingTransactions } = useRollerStore();

  useEffect(() => {
    if (isDevelopment) {
      console.log('loaded config in L2PointHeader:', config);
    }
  }, [config]);

  const { push, names }: any = useHistory();

  const goToInvites = useCallback(() => push(names.INVITE_COHORT), [
    push,
    names.INVITE_COHORT,
  ]);
  const goToHistory = useCallback(() => push(names.TRANSACTION_HISTORY), [
    names.TRANSACTION_HISTORY,
    push,
  ]);

  return (
    <Row className="l2-point-header">
      <AccountsDropdown />
      <Row className="info">
        {!hideInvites && (
          <Row onClick={goToInvites} className="invites">
            <InviteIcon />
            {numInvites}
          </Row>
        )}
        {!hideTimer && currentL2 && !pendingTransactions.length && (
          <Box className="rollup-timer" onClick={goToHistory}>
            {nextRoll}
          </Box>
        )}
        {currentL2 && <HistoryIcon className="history" onClick={goToHistory} />}
      </Row>
    </Row>
  );
};

export default L2PointHeader;
