import React, { useCallback, useState } from 'react';
import { H4, Grid } from 'indigo-react';

import { useHistory } from 'store/history';
import { useWallet } from 'store/wallet';

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
import Metamask from './Login/Metamask';

const NAMES = {
  TICKET: 'TICKET',
  MNEMONIC: 'MNEMONIC',
  HARDWARE: 'HARDWARE',
  ADVANCED: 'ADVANCED',
  METAMASK: 'METAMASK',
};

const VIEWS = {
  [NAMES.TICKET]: Ticket,
  [NAMES.MNEMONIC]: Mnemonic,
  [NAMES.HARDWARE]: Hardware,
  [NAMES.ADVANCED]: Advanced,
  [NAMES.METAMASK]: Metamask,
};

const OPTIONS = [
  { text: 'Master Ticket', value: NAMES.TICKET },
  { text: 'Mnemonic', value: NAMES.MNEMONIC },
  { text: 'Hardware', value: NAMES.HARDWARE },
  { text: 'Advanced', value: NAMES.ADVANCED },
  { text: 'Metamask', value: NAMES.METAMASK },
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
  const { walletType } = useWallet();

  // inputs
  const [currentTab, setCurrentTab] = useState(
    walletTypeToViewName(walletType)
  );

  const goToActivate = useCallback(() => push(names.ACTIVATE), [
    push,
    names.ACTIVATE,
  ]);

  const goHome = useCallback(() => {
    push(names.POINTS);
  }, [push, names]);

  return (
    <View pop={pop} inset>
      <Grid>
        <Grid.Item full as={Crumbs} routes={[{ text: 'Bridge' }]} />
        <Grid.Item full as={H4} className="mt4">
          Login
        </Grid.Item>

        <Grid.Item
          full
          as={Tabs}
          className="mt1"
          // Tabs
          views={VIEWS}
          options={OPTIONS}
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          // Tab extra
          goHome={goHome}
        />
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
