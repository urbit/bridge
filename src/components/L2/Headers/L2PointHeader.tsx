import React, { useEffect, useCallback, useState } from 'react';
import { azimuth } from 'azimuth-js';
import { Box, Button, Icon, Row } from '@tlon/indigo-react';

import useRoller from 'lib/useRoller';
import { useHistory } from 'store/history';
import { ReactComponent as InviteIcon } from 'assets/invite.svg';
import { ReactComponent as HistoryIcon } from 'assets/history.svg';
import AccountsDropdown from '../Dropdowns/AccountsDropdown';
import Modal from '../Modal';
import { useRollerStore } from 'store/roller';

import './L2PointHeader.scss';
import { isDevelopment } from 'lib/flags';
import { usePointCursor } from 'store/pointCursor';

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
  const { pointCursor }: any = usePointCursor();
  const [showModal, setShowModal] = useState(false);

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
  const goMigrate = useCallback(() => push(names.MIGRATE_L2), [
    names.MIGRATE_L2,
    push,
  ]);

  const isStar =
    pointCursor?.value &&
    azimuth.getPointSize(pointCursor?.value) === azimuth.PointSize.Star;

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
        {!currentL2 && isStar && (
          <Icon
            icon="Swap"
            className="history"
            onClick={() => setShowModal(true)}
          />
        )}
      </Row>
      <Modal show={showModal} hide={() => setShowModal(false)}>
        <Box className="migrate-modal">
          <Box className="close" onClick={() => setShowModal(false)}>
            &#215;
          </Box>
          <Box className="title">Migrating to Layer 2</Box>
          <Box className="message">
            We've upgraded Bridge to support Layer 2 transactions. If you don't
            migrate now, you can always do it later.
          </Box>
          <Box className="warning">Migrating to Layer 2 is irreversible.</Box>
          <Row className="buttons">
            <Button className="cancel" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button className="migrate" onClick={goMigrate}>
              Migrate
            </Button>
          </Row>
        </Box>
      </Modal>
    </Row>
  );
};

export default L2PointHeader;
