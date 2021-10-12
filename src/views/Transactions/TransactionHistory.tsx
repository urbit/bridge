import React, { useCallback, useEffect, useMemo, useState } from 'react';

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
import { ShipRow } from './ShipRow';

interface GroupedTransactions {
  [ship: string]: RollerTransaction[];
}

const TransactionHistory = () => {
  const { pop }: any = useLocalRouter();
  const { api } = useRoller();
  const { wallet }: any = useWallet();
  const address = need.addressFromWallet(wallet);
  const [transactions, setTransactions] = useState<RollerTransaction[]>([]);

  const txnsByPatp = useMemo(() => {
    return transactions.reduce((memo, tx) => {
      if (Object.keys(memo).includes(tx.ship)) {
        memo[tx.ship].push(tx);
      } else {
        memo[tx.ship] = [tx];
      }
      return memo;
    }, {} as GroupedTransactions);
  }, [transactions]);

  const txKeys = useMemo(() => {
    return Object.keys(txnsByPatp).sort();
  }, [txnsByPatp]);

  const fetchTransactions = useCallback(async () => {
    const txns = await api.getHistory(address);
    setTransactions(txns);
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
            {txKeys.map(patp => {
              return (
                <>
                  <ShipRow patp={patp} />
                  {txnsByPatp[patp]
                    .sort((a, b) => {
                      return a.time - b.time;
                    })
                    .map(tx => (
                      <TransactionRow key={tx.time} {...tx} />
                    ))}
                </>
              );
            })}
          </Box>
        </BodyPane>
      </Window>
    </View>
  );
};

export default TransactionHistory;
