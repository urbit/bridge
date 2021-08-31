import React from 'react';
import { Grid, Text } from 'indigo-react';
import { useWallet } from 'store/wallet';

import { useLocalRouter } from 'lib/LocalRouter';

import ViewHeader from 'components/ViewHeader';
import View from 'components/View';
import WarningBox from 'components/WarningBox';

import CopiableAddressWrap from 'components/copiable/CopiableAddressWrap';
import Highlighted from 'components/Highlighted';

import * as need from 'lib/need';

export default function Xpub() {
  const { pop } = useLocalRouter();
  const { urbitWallet } = useWallet();

  const { xpub: zpub } = need.urbitWallet(urbitWallet).bitcoinMainnet.keys;
  const { xpub: vpub } = need.urbitWallet(urbitWallet).bitcoinTestnet.keys;

  // set to false for BTC testnet
  const isMainnet = true;

  return (
    <View pop={pop} inset>
      <Grid className="mt4">
        <Grid.Item full as={ViewHeader}>
          Bitcoin
        </Grid.Item>
        <Grid.Item full as={WarningBox}>
          We do not recommend using this feature for significant amounts of
          money, since your private keys are exposed to the browser.
        </Grid.Item>
        <Grid.Item full className="mt4" as={Text}>
          The public key derived from your master ticket.
        </Grid.Item>
        <Grid.Item full className="mt4" as={Text}>
          Paste it into landscape while setting up your wallet.
        </Grid.Item>
        <Grid.Item full className="mt4" as={Text}>
          <Highlighted>
            <CopiableAddressWrap>{isMainnet ? zpub : vpub}</CopiableAddressWrap>
          </Highlighted>
        </Grid.Item>
      </Grid>
    </View>
  );
}
