import React from 'react';
import { Just, Nothing } from 'folktale/maybe';
import { includes } from 'lodash';

import Footer from './components/Footer';
import Header from './components/Header';
import { Container, Row, Col } from './components/Base';

import { router } from './lib/router';
import { ROUTE_NAMES } from './lib/routeNames';
import { HistoryProvider, withHistory, useHistory } from './store/history';
import { TxnConfirmationsProvider } from './store/txnConfirmations';
import { NETWORK_TYPES } from './lib/network';
import {
  WALLET_NAMES,
  DEFAULT_HD_PATH,
  walletFromMnemonic,
  addressFromSecp256k1Public,
} from './lib/wallet';
import { BRIDGE_ERROR } from './lib/error';
import { isDevelopment } from './lib/flags';
import nest from './lib/nest';
import { OnlineProvider } from './store/online';
import { NetworkProvider } from './store/network';

// NB(shrugs): toggle this variable to use the default local state.
// don't commit changes to this line, but there shouldn't be a problem
// if you do because we'll never stub on a production build.
const shouldStubLocal = false;
const isStubbed = isDevelopment && shouldStubLocal;
const kInitialRoutes = isStubbed
  ? [
      { name: ROUTE_NAMES.SHIPS },
      { name: ROUTE_NAMES.WALLET },
      { name: ROUTE_NAMES.NETWORK },
      { name: ROUTE_NAMES.LANDING },
    ]
  : [{ name: ROUTE_NAMES.LANDING }];
const kInitialNetworkType = isDevelopment
  ? NETWORK_TYPES.LOCAL
  : NETWORK_TYPES.MAINNET;

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
]);

class Bridge extends React.Component {
  constructor(props) {
    super(props);

    // NB (jtobin):
    //
    // Note that the 'wallet' prop has type depending on the 'walletType' prop.
    // These could be bound together in a single structure (so that
    // 'walletType' acted more explicitly as a data constructor of sorts) but
    // it doesn't necessarily help us much, since we branch on 'walletType'
    // before setting 'wallet'.
    //
    // Wallets are always wrapped in Maybe.  For most authentication
    // mechanisms, Maybe wraps a BIP32 HD wallet; for Ethereum private keys,
    // JSON keystore files, and Metamask authentication, it wraps an
    // 'EthereumWallet'.

    this.state = {
      // wallet
      walletType: WALLET_NAMES.MNEMONIC,
      wallet: Nothing(),
      walletHdPath: DEFAULT_HD_PATH,
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

    this.setWalletType = this.setWalletType.bind(this);
    this.setWallet = this.setWallet.bind(this);
    this.setWalletHdPath = this.setWalletHdPath.bind(this);
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
    if (isStubbed) {
      const mnemonic = process.env.REACT_APP_DEV_MNEMONIC;
      const hdpath = process.env.REACT_APP_HD_PATH;

      this.setState({
        pointCursor: Just(0),
        walletType: WALLET_NAMES.MNEMONIC,
        wallet: walletFromMnemonic(mnemonic, hdpath),
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

  setWalletType(symbol) {
    if (includes(WALLET_NAMES, symbol)) {
      this.setState({
        walletType: symbol,
      });
    } else {
      throw BRIDGE_ERROR.INVALID_WALLET_TYPE;
    }
  }

  setWallet(wallet) {
    wallet.map(wal => {
      wal.address = wal.address || addressFromSecp256k1Public(wal.publicKey);
      return wal;
    });
    this.setState({ wallet });
  }

  setWalletHdPath(walletHdPath) {
    this.setState({ walletHdPath });
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
      walletType,
      walletHdPath,
      wallet,
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
        initialNetworkType={kInitialNetworkType}>
        <Container>
          <Row>
            <VariableWidthColumn>
              <Header
                skipRoute={this.skipRoute}
                wallet={wallet}
                pointCursor={pointCursor}
              />

              <Row className={'row wrapper'}>
                <Router
                  setWalletType={
                    this.setWalletType // wallet
                  }
                  setWalletHdPath={this.setWalletHdPath}
                  setWallet={this.setWallet}
                  walletType={walletType}
                  walletHdPath={walletHdPath}
                  wallet={wallet}
                  urbitWallet={
                    urbitWallet // urbit wallet
                  }
                  setUrbitWallet={this.setUrbitWallet}
                  authMnemonic={authMnemonic}
                  setAuthMnemonic={this.setAuthMnemonic}
                  setPointCursor={
                    this.setPointCursor // point
                  }
                  addToPointCache={this.addToPointCache}
                  pointCursor={pointCursor}
                  pointCache={pointCache}
                  networkSeedCache={networkSeedCache}
                  networkRevisionCache={networkRevisionCache}
                  setNetworkSeedCache={this.setNetworkSeedCache}
                  onSent={
                    this.setTxnHashCursor // txn
                  }
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
