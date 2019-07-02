import React, { useCallback, useState } from 'react';
import Maybe from 'folktale/maybe';
import * as azimuth from 'azimuth-js';

import { H4, Grid } from 'indigo-react';

import Ticket from './Login/Ticket';
import Mnemonic from './Login/Mnemonic';
import Advanced from './Login/Advanced';
import Hardware from './Login/Hardware';

import * as need from 'lib/need';

import { useHistory } from 'store/history';
import { useNetwork } from 'store/network';
import { useWallet } from 'store/wallet';
import { usePointCursor } from 'store/pointCursor';

import View from 'components/View';
import Tabs from 'components/Tabs';
import Crumbs from 'components/Crumbs';
import Footer from 'components/Footer';
import { ForwardButton, OfflineButton } from 'components/Buttons';

const NAMES = {
  TICKET: 'TICKET',
  MNEMONIC: 'MNEMONIC',
  HARDWARE: 'HARDWARE',
  ADVANCED: 'ADVANCED',
};

const VIEWS = {
  [NAMES.TICKET]: Ticket,
  [NAMES.MNEMONIC]: Mnemonic,
  [NAMES.HARDWARE]: Hardware,
  [NAMES.ADVANCED]: Advanced,
};

const OPTIONS = [
  { text: 'Master Ticket', value: NAMES.TICKET },
  { text: 'Mnemonic', value: NAMES.MNEMONIC },
  { text: 'Hardware', value: NAMES.HARDWARE },
  { text: 'Advanced', value: NAMES.ADVANCED },
];

export default function Login() {
  // globals
  const { push, replaceWith, names } = useHistory();
  const { contracts } = useNetwork();
  const { wallet } = useWallet();
  const { pointCursor, setPointCursor } = usePointCursor();

  // inputs
  const [currentTab, setCurrentTab] = useState(NAMES.TICKET);

  const goToActivate = useCallback(
    () => replaceWith([{ key: names.LANDING }, { key: names.ACTIVATE }]),
    [replaceWith, names]
  );

  const goToPoints = useCallback(() => {
    push(names.POINTS);
  }, [push, names]);

  const goToPoint = useCallback(() => {
    goToPoints();
    push(names.POINT);
  }, [goToPoints, push, names]);

  const doContinue = useCallback(async () => {
    const _wallet = need.wallet(wallet);
    const _contracts = need.contracts(contracts);

    // if no point cursor set by login logic, try to deduce it
    let deduced = pointCursor;
    if (Maybe.Nothing.hasInstance(deduced)) {
      const owned = await azimuth.azimuth.getOwnedPoints(
        _contracts,
        _wallet.address
      );
      if (owned.length === 1) {
        deduced = Maybe.Just(owned[0]);
      } else if (owned.length === 0) {
        const canOwn = await azimuth.azimuth.getTransferringFor(
          _contracts,
          _wallet.address
        );
        if (canOwn.length === 1) {
          deduced = Maybe.Just(canOwn[0]);
        }
      }
    }

    // if we have a deduced point or one in the global context,
    // navigate to that specific point, otherwise navigate to list of points
    if (Maybe.Just.hasInstance(deduced)) {
      setPointCursor(deduced);
      goToPoint();
    } else {
      goToPoints();
    }
  }, [contracts, pointCursor, setPointCursor, wallet, goToPoint, goToPoints]);

  return (
    <View inset>
      <Grid>
        <Grid.Item full as={Crumbs} routes={[{ text: 'Multipass' }]} />
        <Grid.Item full as={H4} className="mt4">
          Login
        </Grid.Item>

        <Grid.Item
          full
          as={Tabs}
          className="mt1"
          views={VIEWS}
          options={OPTIONS}
          currentTab={currentTab}
          onTabChange={setCurrentTab}
        />

        <Grid.Item
          full
          as={ForwardButton}
          solid
          className="mt3"
          disabled={Maybe.Nothing.hasInstance(wallet)}
          onClick={doContinue}>
          Continue
        </Grid.Item>
      </Grid>

      <Footer>
        <Grid>
          <Grid.Divider />
          <Grid.Item full as={ForwardButton} onClick={goToActivate}>
            Activate
          </Grid.Item>
          <Grid.Divider />
          <Grid.Item full as={OfflineButton} />
        </Grid>
      </Footer>
    </View>
  );
}
