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
import { ReactComponent as Wallet } from 'assets/wallet.svg';
import L2BackButton from './L2BackButton';

export interface L2BackHeaderProps {
  back?: () => void;
  hideBalance?: boolean;
  className?: string;
}

const L2BackHeader = ({
  back,
  className = '',
  hideBalance = false,
}: L2BackHeaderProps) => {
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
        const newBalance = _web3.utils.fromWei(
          await _web3.eth.getBalance(_wallet.address)
        );
        setEthBalance(newBalance);
      }
    };

    if (!currentL2) {
      getEthBalance();
    }
  }, [currentL2, setEthBalance, wallet, web3]);

  const hasBalance = Number(ethBalance.toString()) !== 0;

  return (
    <Row className={`l2-back-header ${className}`}>
      <L2BackButton onBack={goBack} />
      {currentL2 && !hideBalance ? (
        <Row className="rollup-timer">
          <Icon icon="Clock" />
          {nextRoll}
        </Row>
      ) : (
        !hideBalance &&
        hasBalance && (
          <Row className="eth-balance">
            <Wallet className="wallet-icon" />
            <Box>{ethBalance.toString()} ETH</Box>
          </Row>
        )
      )}
    </Row>
  );
};

export default L2BackHeader;
