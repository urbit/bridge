import React, { useCallback, useEffect, useMemo, useState } from 'react';

import * as need from 'lib/need';
import * as ob from 'urbit-ob';
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
import { Box, LoadingSpinner, Row } from '@tlon/indigo-react';
import { PatpRow } from './PatpRow';
import Dropdown from 'components/L2/Dropdowns/Dropdown';
import Sigil from 'components/Sigil';
import { AddressRow } from './AddressRow';

interface GroupedTransactions {
  [ship: string]: RollerTransaction[];
}

const TransactionHistory = () => {
  const { pop, data }: any = useLocalRouter();
  const { api } = useRoller();
  const { wallet }: any = useWallet();
  const address = need.addressFromWallet(wallet);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<RollerTransaction[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const [selectedPatp, setSelectedPatp] = useState<string | null>(null);

  // Pre-filter the results if navigating from Point view
  const filterByPoint = useMemo(() => {
    return data?.filterByPoint.matchWith({
      Nothing: () => null,
      Just: (p: any) => ob.patp(p.value),
    });
  }, [data]);

  const shortAddress = useMemo(() => {
    return address.slice(0, 6);
  }, [address]);

  const fetchTransactions = useCallback(async () => {
    const txns = await api.getHistory(address);
    setTransactions(txns);
    if (filterByPoint) {
      setSelectedPatp(filterByPoint);
    }
    setLoading(false);
  }, [address, api, filterByPoint]);

  const selectPatp = useCallback(patp => {
    setSelectedPatp(patp);
    setDropdownOpen(false);
  }, []);

  const txnsByPatp = useMemo(() => {
    return transactions.reduce((memo, tx) => {
      const patp = tx.ship;
      if (Object.keys(memo).includes(patp)) {
        memo[patp].push(tx);
      } else {
        memo[patp] = [tx];
      }
      return memo;
    }, {} as GroupedTransactions);
  }, [transactions]);

  const txPatps = useMemo(() => {
    return Object.keys(txnsByPatp).sort((a, b) => {
      return ob.patp2dec(`~${a}`) - ob.patp2dec(`~${b}`);
    });
  }, [txnsByPatp]);

  const filteredPatps = useMemo(() => {
    if (!selectedPatp) {
      return txPatps;
    }

    return txPatps.filter(p => p === selectedPatp);
  }, [selectedPatp, txPatps]);

  useEffect(() => {
    fetchTransactions();
    // Load the TX history only once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View
      pop={pop}
      hideBack
      inset
      className="transaction-history"
      header={<L2BackHeader />}>
      <Window>
        <>
          <HeaderPane>
            <Box className="transaction-header">
              <h5>Transactions</h5>
              <Dropdown
                className="transaction-dropdown"
                open={dropdownOpen}
                value={selectedPatp ? selectedPatp : shortAddress}
                toggleOpen={() => setDropdownOpen(!dropdownOpen)}>
                <Box className="divider" />
                <Box className="points">
                  <Row className="entry mono" onClick={() => selectPatp(null)}>
                    <Box>{shortAddress}</Box>
                    <Row>
                      <Box
                        background="black"
                        borderRadius="2px"
                        width="24px"
                        height="24px"></Box>
                    </Row>
                  </Row>
                  {txPatps.map(patp => {
                    return (
                      <Row
                        className="entry mono"
                        onClick={() => selectPatp(patp)}
                        key={patp}>
                        <Box>~{patp}</Box>
                        <Row>
                          <Box className="sigil">
                            <Sigil
                              icon
                              patp={patp}
                              size={1}
                              colors={['#000', '#FFF']}
                            />
                          </Box>
                        </Row>
                      </Row>
                    );
                  })}
                </Box>
              </Dropdown>
            </Box>
          </HeaderPane>
          <BodyPane>
            {loading ? (
              <Box className={'loading'}>
                <LoadingSpinner />
              </Box>
            ) : (
              <Box className="transaction-container">
                {!selectedPatp && <AddressRow address={address} />}
                {filteredPatps && filteredPatps.length > 0 ? (
                  filteredPatps.map(patp => {
                    return (
                      <Box key={patp}>
                        <PatpRow patp={patp} />
                        {txnsByPatp[patp]
                          .sort((a, b) => {
                            return b.time - a.time;
                          })
                          .map(tx => (
                            <TransactionRow key={tx.time} {...tx} />
                          ))}
                      </Box>
                    );
                  })
                ) : (
                  <Box className="no-results">No transactions yet</Box>
                )}
              </Box>
            )}
          </BodyPane>
        </>
      </Window>
    </View>
  );
};

export default TransactionHistory;
