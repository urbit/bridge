import React, { useCallback, useEffect } from 'react';
import { Row, Icon } from '@tlon/indigo-react';

import useRoller from 'lib/useRoller';
import { useHistory } from 'store/history';
import { useRollerStore } from 'store/roller';

import './L2BackHeader.scss';

export interface L2BackHeaderProps {
  back?: () => void;
}

const L2BackHeader = ({ back }: L2BackHeaderProps) => {
  const { config } = useRoller();
  const { nextRoll, currentL2 } = useRollerStore(store => store);
  const { pop }: any = useHistory();

  const goBack = useCallback(() => {
    if (back) {
      back();
    } else {
      pop();
    }
  }, [back, pop]);

  useEffect(() => {
    console.log('loaded config in L2BackHeader:', config);
  }, [config]);

  const ethBalance = 0.032;

  return (
    <Row className="l2-back-header">
      <Icon className="back-button" icon="ChevronWest" onClick={goBack} />
      {currentL2 ? (
        <div className="rollup-timer">
          <Icon icon="Clock" />
          {nextRoll}
        </div>
      ) : (
        <div className="eth-balance">Balance: {ethBalance} ETH</div>
      )}
    </Row>
  );
};

export default L2BackHeader;
