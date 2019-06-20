import { Nothing, Just } from 'folktale/maybe';
import React, { useState } from 'react';
import * as azimuth from 'azimuth-js';

import { H1 } from 'indigo-react';
import View from '../components/View';
import Tabs from '../components/Tabs';

import Ticket from './Login/Ticket';
import Mnemonic from './Login/Mnemonic';
import Advanced from './Login/Advanced';

import * as need from '../lib/need';
import { ROUTE_NAMES } from '../lib/routeNames';

import { useHistory } from '../store/history';
import { useNetwork } from '../store/network';
import { useWallet } from '../store/wallet';
import { usePointCursor } from '../store/pointCursor';

const TABS = {
  TICKET: Symbol('TICKET'),
  MNEMONIC: Symbol('MNEMONIC'),
  ADVANCED: Symbol('ADVANCED'),
};

export default function Login() {
  // globals
  const history = useHistory();
  const { contracts } = useNetwork();
  const { wallet } = useWallet();
  const { pointCursor, setPointCursor } = usePointCursor();

  // inputs
  const [currentTab, setCurrentTab] = useState(TABS.TICKET);

  //TODO figure out how to do things once
  // // we expect wallet and pointCursor to not be set yet
  // setUrbitWallet(Nothing());
  // setWallet(Nothing());
  // setPointCursor(Nothing());

  const doContinue = async () => {
    const realWallet = need.wallet(wallet);
    const realContracts = need.contracts(contracts);

    // if no point cursor set by login logic, try to deduce it
    let deduced = Nothing();
    if (Nothing.hasInstance(this.props.pointCursor)) {
      const owned = await azimuth.azimuth.getOwnedPoints(
        realContracts,
        realWallet.address
      );
      if (owned.length === 1) {
        deduced = Just(owned[0]);
      } else if (owned.length === 0) {
        const canOwn = await azimuth.azimuth.getTransferringFor(
          realContracts,
          realWallet.address
        );
        if (canOwn.length === 1) {
          deduced = Just(canOwn[0]);
        }
      }
    }

    if (Just.hasInstance(deduced)) {
      setPointCursor(deduced);
      history.popAndPush(ROUTE_NAMES.POINT_HOME);
    } else if (Just.hasInstance(pointCursor)) {
      history.popAndPush(ROUTE_NAMES.POINT_HOME);
    } else {
      //TODO to new overview (maybe should be merged into point home?)
      history.popAndPush(ROUTE_NAMES.POINTS);
    }
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
