import React, { useCallback, useState } from 'react';
import { Just, Nothing } from 'folktale/maybe';
import * as azimuth from 'azimuth-js';
import { H4, Grid } from 'indigo-react';

import { useHistory } from 'store/history';
import { useNetwork } from 'store/network';
import { useWallet } from 'store/wallet';
import { usePointCursor } from 'store/pointCursor';

import * as need from 'lib/need';
import { WALLET_TYPES } from 'lib/wallet';

import View from 'components/View';
import Tabs from 'components/Tabs';
import Crumbs from 'components/Crumbs';
import Footer from 'components/Footer';
import { ForwardButton, OfflineButton } from 'components/Buttons';

import Ticket from './Login/Ticket';
import Mnemonic from './Login/Mnemonic';
import Advanced from './Login/Advanced';
import Hardware from './Login/Hardware';

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

const walletTypeToViewName = walletType => {
  switch (walletType) {
    case WALLET_TYPES.MNEMONIC:
      return NAMES.MNEMONIC;
    case WALLET_TYPES.LEDGER:
    case WALLET_TYPES.TREZOR:
      return NAMES.HARDWARE;
    case WALLET_TYPES.KEYSTORE:
    case WALLET_TYPES.PRIVATE_KEY:
      return NAMES.ADVANCED;
    case WALLET_TYPES.TICKET:
    case WALLET_TYPES.SHARDS:
      return NAMES.TICKET;
    default:
      return NAMES.TICKET;
  }
};

export default function Login() {
  // globals
  const { pop, push, names } = useHistory();
  const { contracts } = useNetwork();
  const { wallet, walletType } = useWallet();
  const { pointCursor, setPointCursor } = usePointCursor();

  const [deducing, setDeducing] = useState(false);

  // inputs
  const [currentTab, setCurrentTab] = useState(
    walletTypeToViewName(walletType)
  );

  const goToActivate = useCallback(() => push(names.ACTIVATE), [
    push,
    names.ACTIVATE,
  ]);

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

    setDeducing(true);

    let deduced = pointCursor;
    // if no point cursor set by login logic, try to deduce it
    if (Nothing.hasInstance(deduced)) {
      const owned = await azimuth.azimuth.getOwnedPoints(
        _contracts,
        _wallet.address
      );
      if (owned.length === 1) {
        deduced = Just(owned[0]);
      }
    }

    setDeducing(false);

    // if we have a deduced point or one in the global context,
    // navigate to that specific point, otherwise navigate to list of points
    if (Just.hasInstance(deduced)) {
      setPointCursor(deduced);
      goToPoint();
    } else {
      goToPoints();
    }
  }, [contracts, pointCursor, setPointCursor, wallet, goToPoint, goToPoints]);

  return (
    <View pop={pop} inset>
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
          className="mt2"
          loading={deducing}
          disabled={Nothing.hasInstance(wallet) || deducing}
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
