import React, { useCallback, useState } from 'react';
import { P, H4, H5, Grid, Text } from 'indigo-react';

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
  const [isOther, setisOther] = useState(false);

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
        <Grid.Item full as={Text} className="flex justify-center mt4">
          <Grid.Item as={Text} className="gray5">
            Urbit ID /&nbsp;
          </Grid.Item>
          <Grid.Item as={Text}>Login</Grid.Item>
        </Grid.Item>
        {isOther && <Grid.Item full as={Other} />}
        {!isOther && <Grid.Item full as={Ticket} />}
        {!isOther && (
          <Grid.Item full as={ForwardButton} onClick={() => setisOther(true)}>
            Metamask ledger, etc.
          </Grid.Item>
        )}
        {isOther && (
          <Grid.Item
            onClick={() => setisOther(false)}
            className="underline gray4">
            Back
          </Grid.Item>
        )}
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
