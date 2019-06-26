import React from 'react';
import { Just, Nothing } from 'folktale/maybe';
import { IndigoApp } from 'indigo-react';

import Router from 'components/Router';

import Provider from 'store/Provider';

import { ROUTE_NAMES } from 'lib/routeNames';
import { ROUTES } from 'lib/router';
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
      { key: ROUTE_NAMES.LANDING },
      { key: ROUTE_NAMES.LOGIN },
      { key: ROUTE_NAMES.POINTS },
      { key: ROUTE_NAMES.POINT },
      { key: ROUTE_NAMES.INVITE },
    ]
  : [{ key: ROUTE_NAMES.LANDING }];

const kInitialWallet = kIsStubbed
  ? walletFromMnemonic(
      process.env.REACT_APP_DEV_MNEMONIC,
      process.env.REACT_APP_HD_PATH
    )
  : undefined;
const kInitialMnemonic = kIsStubbed
  ? Just(process.env.REACT_APP_DEV_MNEMONIC)
  : Nothing();
const kInitialPointCursor = kIsStubbed ? Just(65792) : Nothing();

export default function Bridge() {
  return (
    <Provider
      views={ROUTES}
      names={ROUTE_NAMES}
      initialRoutes={kInitialRoutes}
      initialNetworkType={kInitialNetworkType}
      initialWallet={kInitialWallet}
      initialMnemonic={kInitialMnemonic}
      initialPointCursor={kInitialPointCursor}>
      <IndigoApp>
        <Router />
      </IndigoApp>
    </Provider>
  );
}
