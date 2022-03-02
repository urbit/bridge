import React, { useCallback } from 'react';
import { Box, LoadingSpinner, Row } from '@tlon/indigo-react';
import { Nothing } from 'folktale/maybe';

import { useHistory } from 'store/history';
import { useRollerStore } from 'store/rollerStore';
import { usePointCursor } from 'store/pointCursor';

import HeaderButton from './HeaderButton';
import AccountsDropdown from '../Dropdowns/AccountsDropdown';
import './L2PointHeader.scss';
import LayerIndicator from '../LayerIndicator';
import { useInviteStore } from 'views/Invite/useInvites';

export interface L2PointHeaderProps {
  hideHome?: boolean;
  hideInvites?: boolean;
  showMigrate?: boolean;
}

const L2PointHeader = ({
  hideHome = false,
  hideInvites = false,
  showMigrate = false,
}: L2PointHeaderProps) => {
  const { point, pointList } = useRollerStore();
  const { invites, loading: invitesLoading } = useInviteStore();
  const { pointCursor, setPointCursor }: any = usePointCursor();
  const numInvites = invites[point.value]?.length;

  const { popTo, push, names }: any = useHistory();

  const goToHome = useCallback(() => {
    popTo(names.POINTS);
    setPointCursor(Nothing());
  }, [popTo, setPointCursor, names]);
  const goToInvites = useCallback(() => push(names.INVITE_COHORT), [
    push,
    names.INVITE_COHORT,
  ]);
  const goToHistory = useCallback(
    () => push(names.TRANSACTION_HISTORY, { filterByPoint: pointCursor }),
    [names.TRANSACTION_HISTORY, pointCursor, push]
  );

  const showInvites =
    !hideInvites &&
    Boolean(pointCursor?.value && point.isStar && point.isL2Spawn);

  const renderInviteButton = () => {
    if (!showInvites || !point.showInvites) {
      return null;
    } else if (invitesLoading) {
      return (
        <Row onClick={goToInvites} className="invites">
          <LoadingSpinner foreground="rgba(0,0,0,0.3)" background="white" />
          Invites
        </Row>
      );
    } else if (numInvites === 0) {
      return (
        <Row onClick={goToInvites} className="invites create">
          Create Invites
        </Row>
      );
    } else {
      return (
        <Row onClick={goToInvites} className="invites">
          <Box className="count">{numInvites}</Box> Invites
        </Row>
      );
    }
  };

  return (
    <Row className="l2-point-header">
      <Row>
        {!hideHome && pointList.length > 1 && (
          <HeaderButton className="home" icon="Home" onClick={goToHome} />
        )}
        <AccountsDropdown showMigrate={showMigrate} />
        {point.value > -1 && (
          <LayerIndicator size="lg" layer={point.layer} className="header" />
        )}
        {/* uncomment for L2 spawn badge */}
        {/* {point.isL1 && point.isL2Spawn && <Box className="l2-spawn">L2 Spawn</Box>} */}
      </Row>
      <Row className="info">
        {renderInviteButton()}
        <Box className="history" onClick={goToHistory}>
          History
        </Box>
      </Row>
    </Row>
  );
};

export default L2PointHeader;
