import React, { useEffect, useState } from 'react';
import { Row, Box } from '@tlon/indigo-react';

import * as need from 'lib/need';
import { useWallet } from 'store/wallet';
import useRoller from 'lib/useRoller';
import { useLocalRouter } from 'lib/LocalRouter';

import View from 'components/View';
import L2BackHeader from 'components/L2/Headers/L2BackHeader';
import { RollerTransaction } from '@urbit/roller-api';

import './TransactionHistory';

const TransactionHistory = () => {
  const { pop }: any = useLocalRouter();
  const { api } = useRoller();
  const { wallet }: any = useWallet();
  const address = need.addressFromWallet(wallet);
  const [transactions, setTransactions] = useState<RollerTransaction[]>([]);

  useEffect(() => {
    const getTransactionHistory = async () => {
      const txns = await api.getHistory(address);
      setTransactions(txns);
    };

    getTransactionHistory();
  }, [api, address]);

  return (
    <View
      pop={pop}
      hideBack
      inset
      className="transaction-history"
      header={<L2BackHeader />}>
      {transactions.map(({ ship, status, type, hash }) => (
        <Box className="transaction">
          <Row className="title-row">
            <Box className="title">{type}</Box>
            <Box className="hash">{hash}</Box>
          </Row>
          <Row className="info-row">
            <Box className="status">{status}</Box>
            <Box className="date"></Box>
          </Row>
        </Box>
      ))}
    </View>
  );
};

export default TransactionHistory;
