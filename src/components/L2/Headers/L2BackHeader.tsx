import React, { useCallback, useEffect, useState } from 'react';
import { Row, Icon, Box } from '@tlon/indigo-react';

import useRoller from 'lib/useRoller';
import { useHistory } from 'store/history';
import { useRollerStore } from 'store/roller';

import './L2BackHeader.scss';
import { useNetwork } from 'store/network';
import { useWallet } from 'store/wallet';
import { toBN } from 'web3-utils';
import BN from 'bn.js';
import { isDevelopment } from 'lib/flags';

export interface L2BackHeaderProps {
  back?: () => void;
  hideBalance?: boolean;
}

const L2BackHeader = ({ back, hideBalance = false }: L2BackHeaderProps) => {
  const { config } = useRoller();
  const { nextRoll, currentL2 } = useRollerStore(store => store);
  const { pop }: any = useHistory();
  const { wallet }: any = useWallet();
  const { web3 }: any = useNetwork();

  const [ethBalance, setEthBalance] = useState<BN>(toBN(0));

  const goBack = useCallback(() => {
    if (back) {
      back();
    } else {
      pop();
    }
  }, [back, pop]);

  useEffect(() => {
    if (isDevelopment) {
      console.log('loaded config in L2BackHeader:', config);
    }
  }, [config]);

  useEffect(() => {
    const getEthBalance = async () => {
      const _web3 = web3.getOrElse(null);
      const _wallet = wallet.getOrElse(null);

      if (_web3 && _wallet) {
        const newBalance = toBN(await _web3.eth.getBalance(_wallet.address));
        setEthBalance(newBalance);
      }
    };

    if (!currentL2) {
      getEthBalance();
    }
  }, [currentL2, setEthBalance, wallet, web3]);

  return (
    <Row className="l2-back-header">
      <Icon className="back-button" icon="ChevronWest" onClick={goBack} />
      {currentL2 ? (
        <Row className="rollup-timer">
          <Icon icon="Clock" />
          {nextRoll}
        </Row>
      ) : (
        !hideBalance && (
          <Box className="eth-balance">Balance: {Number(ethBalance)} ETH</Box>
        )
      )}
    </Row>
  );
};

export default L2BackHeader;
