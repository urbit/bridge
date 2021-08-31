import React, { useEffect, useState } from 'react';
import { Row } from '@tlon/indigo-react';

import * as need from 'lib/need';
import { useWallet } from 'store/wallet';
import useRoller from 'lib/useRoller';
import { useLocalRouter } from 'lib/LocalRouter';

import View from 'components/View';
import L2BackHeader from 'components/L2/Headers/L2BackHeader';
import { AddressHistory } from '@urbit/roller-api';

import './TransactionHistory';

const TransactionHistory = () => {
  const { pop }: any = useLocalRouter();
  const { api } = useRoller();
  const { wallet }: any = useWallet();
  const address = need.addressFromWallet(wallet);
  const [transactions, setTransactions] = useState<AddressHistory>([]);

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
        <div className="transaction">
          <Row className="title-row">
            <div className="title">{type}</div>
            <div className="hash">{hash}</div>
          </Row>
          <Row className="info-row">
            <div className="status">{status}</div>
            <div className="date"></div>
          </Row>
        </div>
      ))}
    </View>
  );
};

export default TransactionHistory;
