import React from 'react';
import { Just, Nothing } from 'folktale/maybe';
import { IndigoApp } from 'indigo-react';

import View from 'components/View';
import Router from 'components/Router';

import Provider from 'store/Provider';

import Header from './components/old/Header';

import { ROUTE_NAMES } from 'lib/routeNames';
import { NETWORK_TYPES } from 'lib/network';
import { walletFromMnemonic } from 'lib/wallet';
import { isDevelopment } from 'lib/flags';

import 'style/index.scss';

const kInitialNetworkType = isDevelopment
  ? NETWORK_TYPES.LOCAL
  : NETWORK_TYPES.MAINNET;

// NB(shrugs): modify these variables to change the default local state.
const shouldStubLocal = process.env.REACT_APP_STUB_LOCAL === 'true';
const kIsStubbed = isDevelopment && shouldStubLocal;
const kInitialRoutes = kIsStubbed
  ? [
      { name: ROUTE_NAMES.LANDING },
      { name: ROUTE_NAMES.NETWORK },
      { name: ROUTE_NAMES.WALLET },
      { name: ROUTE_NAMES.SHIPS },
    ]
  : [{ name: ROUTE_NAMES.LANDING }];

const kInitialWallet = kIsStubbed
  ? walletFromMnemonic(
      process.env.REACT_APP_DEV_MNEMONIC,
      process.env.REACT_APP_HD_PATH
    )
  : undefined;
const kInitialMnemonic = kIsStubbed
  ? Just(process.env.REACT_APP_DEV_MNEMONIC)
  : Nothing();
const kInitialPointCursor = kIsStubbed ? Just(0) : Nothing();

export default function Bridge() {
  return (
    <Provider
      initialRoutes={kInitialRoutes}
      initialNetworkType={kInitialNetworkType}
      initialWallet={kInitialWallet}
      initialMnemonic={kInitialMnemonic}
      initialPointCursor={kInitialPointCursor}>
      <IndigoApp>
        <View>
          <Header />
          <Router />
        </View>
      </IndigoApp>
    </Provider>
  );
}
