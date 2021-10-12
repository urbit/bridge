import React, { useCallback, useEffect, useState } from 'react';

import * as need from 'lib/need';
import { useWallet } from 'store/wallet';
import useRoller from 'lib/useRoller';
import { useLocalRouter } from 'lib/LocalRouter';

import View from 'components/View';
import L2BackHeader from 'components/L2/Headers/L2BackHeader';
import Window from 'components/L2/Window/Window';
import HeaderPane from 'components/L2/Window/HeaderPane';
import BodyPane from 'components/L2/Window/BodyPane';
import { RollerTransaction } from '@urbit/roller-api';

import './TransactionHistory.scss';
import { TransactionRow } from './TransactionRow';
import { Box } from '@tlon/indigo-react';

const TransactionHistory = () => {
  const { pop }: any = useLocalRouter();
  const { api } = useRoller();
  const { wallet }: any = useWallet();
  const address = need.addressFromWallet(wallet);
  const [transactions, setTransactions] = useState<RollerTransaction[]>([]);

  const fetchTransactions = useCallback(async () => {
    const txns = await api.getHistory(address);
    const sortedTxns = txns.sort((a, b) => a.time - b.time)
    setTransactions(sortedTxns);
  }, [address, api]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return (
    <View
      pop={pop}
      hideBack
      inset
      className="transaction-history"
      header={<L2BackHeader />}>
      <Window>
        <HeaderPane>
          <h5>Transactions</h5>
        </HeaderPane>
        <BodyPane>
          <Box className="transaction-container">
            {transactions.map(tx => (
              <TransactionRow key={tx.time} {...tx} />
            ))}
          </Box>
        </BodyPane>
      </Window>
    </View>
  );
};

export default TransactionHistory;
