import { Nothing, Just } from 'folktale/maybe';
import React, { useState } from 'react';
import * as azimuth from 'azimuth-js';

import { H1 } from 'indigo-react';
import View from 'components/View';
import Tabs from 'components/Tabs';

import Ticket from './Login/Ticket';
import Mnemonic from './Login/Mnemonic';
import Advanced from './Login/Advanced';

import useLifecycle from 'lib/useLifecycle';
import * as need from 'lib/need';
import { ROUTE_NAMES } from 'lib/routeNames';

import { useHistory } from 'store/history';
import { useNetwork } from 'store/network';
import { useWallet } from 'store/wallet';
import { usePointCursor } from 'store/pointCursor';

const TABS = {
  TICKET: Symbol('TICKET'),
  MNEMONIC: Symbol('MNEMONIC'),
  ADVANCED: Symbol('ADVANCED'),
};

const tabViews = {
  [TABS.TICKET]: Ticket,
  [TABS.MNEMONIC]: Mnemonic,
  [TABS.ADVANCED]: Advanced,
};

const tabOptions = [
  { title: 'Ticket', value: TABS.TICKET },
  { title: 'Mnemonic', value: TABS.MNEMONIC },
  { title: 'Advanced', value: TABS.ADVANCED },
];

export default function Login() {
  // globals
  const history = useHistory();
  const { contracts } = useNetwork();
  const { wallet, setUrbitWallet } = useWallet();
  const { pointCursor, setPointCursor } = usePointCursor();

  // inputs
  const [currentTab, setCurrentTab] = useState(TABS.TICKET);

  // on-mount
  useLifecycle(() => {
    setUrbitWallet(Nothing());
    setPointCursor(Nothing());
  });

  const doContinue = async () => {
    const _wallet = need.wallet(wallet);
    const _contracts = need.contracts(contracts);

    // if no point cursor set by login logic, try to deduce it
    let deduced = Nothing();
    if (Nothing.hasInstance(pointCursor)) {
      const owned = await azimuth.azimuth.getOwnedPoints(
        _contracts,
        _wallet.address
      );
      if (owned.length === 1) {
        deduced = Just(owned[0]);
      } else if (owned.length === 0) {
        const canOwn = await azimuth.azimuth.getTransferringFor(
          _contracts,
          _wallet.address
        );
        if (canOwn.length === 1) {
          deduced = Just(canOwn[0]);
        }
      }
    }

    // if we have a deduced point or one in the global context,
    // navigate to that specific point, otherwise navigate to list of points
    if (Just.hasInstance(deduced)) {
      setPointCursor(deduced);
      history.popAndPush(ROUTE_NAMES.POINT);
    } else if (Just.hasInstance(pointCursor)) {
      history.popAndPush(ROUTE_NAMES.POINT);
    } else {
      history.popAndPush(ROUTE_NAMES.POINTS);
    }
  };

  return (
    <View>
      <H1>Login</H1>

      <Tabs
        tabViews={tabViews}
        tabOptions={tabOptions}
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        //
        loginCompleted={doContinue}
      />
    </View>
  );
}
