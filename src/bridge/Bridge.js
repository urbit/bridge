import React from 'react';
import { Just, Nothing } from 'folktale/maybe';

import Footer from './components/Footer';
import Header from './components/Header';
import { Container, Row, Col } from './components/Base';

import nest from './lib/nest';
import { router } from './lib/router';
import { ROUTE_NAMES } from './lib/routeNames';
import { NETWORK_TYPES } from './lib/network';
import { walletFromMnemonic } from './lib/wallet';
import { isDevelopment } from './lib/flags';

import { HistoryProvider, useHistory } from './store/history';
import { TxnConfirmationsProvider } from './store/txnConfirmations';
import { OnlineProvider } from './store/online';
import { NetworkProvider } from './store/network';
import { WalletProvider } from './store/wallet';
import { PointCursorProvider } from './store/pointCursor';
import { PointCacheProvider } from './store/pointCache';
import { TxnCursorProvider } from './store/txnCursor';

const kInitialNetworkType = isDevelopment
  ? NETWORK_TYPES.LOCAL
  : NETWORK_TYPES.MAINNET;

// NB(shrugs): modify these variables to change the default local state.
const shouldStubLocal = false;
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

// the router itself is just a component that renders a specific view
// depending on the history
const Router = function() {
  const history = useHistory();
  const Route = router(history.peek());

  return <Route />;
};

// NB(shrugs): separate component because it needs useHistory
// this will be must better structured as part of the UI overhaul
const VariableWidthColumn = function({ children }) {
  const history = useHistory();
  // For the invite acceptance flow, widen the screen to use the full
  // container, and hide the breadcrumbs
  return (
    <Col
      className={
        history.includes(ROUTE_NAMES.INVITE_TICKET)
          ? 'col-md-12'
          : 'col-md-offset-1 col-md-10'
      }
      style={
        history.includes(ROUTE_NAMES.INVITE_TICKET) ? {} : { maxWidth: '620px' }
      }>
      {children}
    </Col>
  );
};

// nest all of the providers within each other to avoid hella depth
const AllProviders = nest([
  HistoryProvider,
  TxnConfirmationsProvider,
  OnlineProvider,
  NetworkProvider,
  WalletProvider,
  PointCursorProvider,
  PointCacheProvider,
  TxnCursorProvider,
]);

function Bridge() {
  return (
    <AllProviders
      initialRoutes={kInitialRoutes}
      initialNetworkType={kInitialNetworkType}
      initialWallet={kInitialWallet}
      initialMnemonic={kInitialMnemonic}
      initialPointCursor={kInitialPointCursor}>
      <Container>
        <Row>
          <VariableWidthColumn>
            <Header />

            <Row className={'row wrapper'}>
              <Router />

              <div className={'push'} />
            </Row>

            <Footer />
          </VariableWidthColumn>
        </Row>
      </Container>
    </AllProviders>
  );
}

export default Bridge;
