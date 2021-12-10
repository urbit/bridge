import React, { useCallback, useEffect } from 'react';
import { Row, Icon, Box } from '@tlon/indigo-react';

import { useHistory } from 'store/history';
import { useRollerStore } from 'store/rollerStore';
import { useNetwork } from 'store/network';
import { useWallet } from 'store/wallet';
import { useTimerStore } from 'store/timerStore';

import { ReactComponent as Wallet } from 'assets/wallet.svg';
import HeaderButton from './HeaderButton';
import './L2BackHeader.scss';

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
  const { point, ethBalance, setEthBalance } = useRollerStore();
  const { nextRoll } = useTimerStore();
  const { pop }: any = useHistory();
  const { wallet }: any = useWallet();
  const { web3 }: any = useNetwork();

  const currentL2 = !!point?.isL2;

  const goBack = useCallback(() => {
    if (back) {
      back();
    } else {
      pop();
    }
  }, [back, pop]);

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

    getEthBalance();
  }, [currentL2, setEthBalance, wallet, web3]);

  return (
    <Row className={`l2-back-header ${className}`}>
      <HeaderButton icon="ChevronWest" onClick={goBack} />
      {currentL2 && !hideBalance ? (
        <Row className="rollup-timer">
          <Icon icon="Clock" />
          {nextRoll}
        </Row>
      ) : (
        !hideBalance && (
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
