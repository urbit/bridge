import React from 'react';
import { Just, Nothing } from 'folktale/maybe';

import Footer from './components/Footer';
import Header from './components/Header';
import { Container, Row, Col } from './components/Base';

import nest from './lib/nest';
import { router } from './lib/router';
import { ROUTE_NAMES } from './lib/routeNames';
import { NETWORK_TYPES } from './lib/network';
import { DEFAULT_HD_PATH, walletFromMnemonic } from './lib/wallet';
import { isDevelopment } from './lib/flags';

import { HistoryProvider, withHistory, useHistory } from './store/history';
import { TxnConfirmationsProvider } from './store/txnConfirmations';
import { OnlineProvider } from './store/online';
import { NetworkProvider } from './store/network';
import { WalletProvider } from './store/wallet';

const kInitialNetworkType = isDevelopment
  ? NETWORK_TYPES.LOCAL
  : NETWORK_TYPES.MAINNET;

// NB(shrugs): toggle these variables to change the default local state.
// try not to commit changes to this line, but there shouldn't be a problem
// if you do because we'll never stub on a production build.
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

// the router itself is just a component that renders a specific view
// depending on the history
const Router = function(props) {
  const history = useHistory();
  const Route = router(history.peek());

  return <Route {...props} />;
};

// NB(shrugs): separate component because it needs withHistory
// this will be must better structured as part of the UI overhaul
const VariableWidthColumn = withHistory(({ history, children }) => (
  // For the invite acceptance flow, widen the screen to use the full
  // container, and hide the breadcrumbs
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
));

// nest all of the providers within each other to avoid hella depth
const AllProviders = nest([
  HistoryProvider,
  TxnConfirmationsProvider,
  OnlineProvider,
  NetworkProvider,
  WalletProvider,
]);

class Bridge extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      // urbit wallet-related
      urbitWallet: Nothing(),
      authMnemonic: Nothing(),
      networkSeedCache: null,
      // point
      pointCursor: Nothing(),
      pointCache: {},
      // txn
      txnHashCursor: Nothing(),
      txnConfirmations: {},
    };

    this.setUrbitWallet = this.setUrbitWallet.bind(this);
    this.setAuthMnemonic = this.setAuthMnemonic.bind(this);
    this.setPointCursor = this.setPointCursor.bind(this);
    this.setTxnHashCursor = this.setTxnHashCursor.bind(this);
    this.setNetworkSeedCache = this.setNetworkSeedCache.bind(this);
    this.addToPointCache = this.addToPointCache.bind(this);
  }

  componentDidMount() {
    // NB (jtobin, shrugs):
    //
    // If running in development, the following can be tweaked to get you set
    // up with a desirable initial state.
    if (kIsStubbed) {
      const mnemonic = process.env.REACT_APP_DEV_MNEMONIC;

      this.setState({
        pointCursor: Just(0),
        urbitWallet: Nothing(),
        authMnemonic: Just(mnemonic),
      });
    }
  }

  setNetworkSeedCache(networkSeed, revision) {
    this.setState({
      networkSeedCache: networkSeed,
      networkRevisionCache: revision,
    });
  }

  // also sets wallet to ownership address
  setUrbitWallet(urbitWallet) {
    let wallet = this.state.wallet;
    if (Just.hasInstance(urbitWallet)) {
      const mnemonic = urbitWallet.value.ownership.seed;
      wallet = walletFromMnemonic(
        mnemonic,
        DEFAULT_HD_PATH,
        urbitWallet.value.meta.passphrase
      );
      wallet.map(wal => {
        wal.address = urbitWallet.value.ownership.keys.address;
        return wal;
      });
    }
    this.setState({ urbitWallet, wallet });
  }

  setAuthMnemonic(authMnemonic) {
    this.setState({ authMnemonic });
  }

  setPointCursor(pointCursor) {
    this.setState({ pointCursor });
  }

  addToPointCache(entry) {
    this.setState((state, _) => ({
      pointCache: Object.assign(state.pointCache, entry),
    }));
  }

  setTxnHashCursor(txnHashCursor) {
    this.setState({ txnHashCursor });
  }

  render() {
    const {
      urbitWallet,
      authMnemonic,
      networkSeedCache,
      networkRevisionCache,
      pointCursor,
      pointCache,
      txnHashCursor,
    } = this.state;

    return (
      <AllProviders
        initialRoutes={kInitialRoutes}
        initialNetworkType={kInitialNetworkType}
        initialWallet={kInitialWallet}>
        <Container>
          <Row>
            <VariableWidthColumn>
              <Header pointCursor={pointCursor} />

              <Row className={'row wrapper'}>
                <Router
                  urbitWallet={urbitWallet}
                  setUrbitWallet={this.setUrbitWallet}
                  authMnemonic={authMnemonic}
                  setAuthMnemonic={this.setAuthMnemonic}
                  setPointCursor={this.setPointCursor}
                  addToPointCache={this.addToPointCache}
                  pointCursor={pointCursor}
                  pointCache={pointCache}
                  networkSeedCache={networkSeedCache}
                  networkRevisionCache={networkRevisionCache}
                  setNetworkSeedCache={this.setNetworkSeedCache}
                  onSent={this.setTxnHashCursor}
                  setTxnHashCursor={this.setTxnHashCursor}
                  txnHashCursor={txnHashCursor}
                />

                <div className={'push'} />
              </Row>

              <Footer />
            </VariableWidthColumn>
          </Row>
        </Container>
      </AllProviders>
    );
  }
}

export default Bridge;
