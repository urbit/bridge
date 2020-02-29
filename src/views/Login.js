import React, { useCallback, useState } from 'react';
import { P, H4, Grid } from 'indigo-react';

import { version } from '../../package.json';

import { useHistory } from 'store/history';
import { useWallet } from 'store/wallet';

import { WALLET_TYPES } from 'lib/wallet';

import View from 'components/View';
import Tabs from 'components/Tabs';
import Crumbs from 'components/Crumbs';
import Footer from 'components/Footer';
import { ForwardButton, OfflineButton } from 'components/Buttons';

import Ticket from './Login/Ticket';
import Other from './Login/Other';

const NAMES = {
  TICKET: 'TICKET',
  OTHER: 'OTHER',
};

const VIEWS = {
  [NAMES.TICKET]: Ticket,
  [NAMES.OTHER]: Other,
};

const OPTIONS = [
  { text: 'Master Ticket', value: NAMES.TICKET },
  { text: 'Other', value: NAMES.OTHER },
];

const walletTypeToViewName = walletType => {
  if (walletType === WALLET_TYPES.TICKET || !walletType) {
    return NAMES.TICKET;
  }
  return NAMES.OTHER;
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
    <View inset>
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
        <Grid.Item full as={P} className="f6">
          Version {version}
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
