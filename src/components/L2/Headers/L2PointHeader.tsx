import React, { useCallback } from 'react';
import { Box, LoadingSpinner, Row } from '@tlon/indigo-react';

import { isStar } from 'lib/utils/point';

import { useHistory } from 'store/history';
import { useRollerStore } from 'store/rollerStore';
import { useTimerStore } from 'store/timerStore';
import { usePointCursor } from 'store/pointCursor';

import { ReactComponent as HistoryIcon } from 'assets/history.svg';
import { ReactComponent as InviteIcon } from 'assets/invite.svg';
import HeaderButton from './HeaderButton';
import AccountsDropdown from '../Dropdowns/AccountsDropdown';
import './L2PointHeader.scss';

export interface L2PointHeaderProps {
  numInvites?: number;
  hideHome?: boolean;
  hideTimer?: boolean;
  hideInvites?: boolean;
  showMigrate?: boolean;
}

const L2PointHeader = ({
  numInvites,
  hideHome = false,
  hideTimer = false,
  hideInvites = false,
  showMigrate = false,
}: L2PointHeaderProps) => {
  const { point, pendingTransactions } = useRollerStore();
  const { nextRoll } = useTimerStore();
  const { pointCursor }: any = usePointCursor();

  const { popTo, push, names }: any = useHistory();

  const goToInvites = useCallback(() => push(names.INVITE_COHORT), [
    push,
    names.INVITE_COHORT,
  ]);
  const goToHistory = useCallback(
    () => push(names.TRANSACTION_HISTORY, { filterByPoint: pointCursor }),
    [names.TRANSACTION_HISTORY, pointCursor, push]
  );

  const showInvites =
    !hideInvites && Boolean(pointCursor?.value && isStar(pointCursor.value));

  return (
    <Row className="l2-point-header">
      <Row>
        {!hideHome && (
          <HeaderButton
            className="home"
            icon="Home"
            onClick={() => popTo(names.POINTS)}
          />
        )}
        <AccountsDropdown showMigrate={showMigrate} />
      </Row>
      <Row className="info">
        {showInvites && point.showInvites && (
          <Row onClick={goToInvites} className="invites">
            <InviteIcon />
            {numInvites === undefined ? (
              <LoadingSpinner foreground="rgba(0,0,0,0.3)" background="white" />
            ) : (
              numInvites
            )}
          </Row>
        )}
        {!hideTimer && point.isL2Spawn && !pendingTransactions.length && (
          <Box className="rollup-timer" onClick={goToHistory}>
            {nextRoll}
          </Box>
        )}
        <HistoryIcon className="history" onClick={goToHistory} />
      </Row>
    </Row>
  );
};

export default L2PointHeader;
