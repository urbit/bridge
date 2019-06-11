import { Just, Nothing } from 'folktale/maybe';
import * as lodash from 'lodash';
import * as azimuth from 'azimuth-js';
import { Stack } from 'immutable';
import { CONTRACT_ADDRESSES } from './lib/contracts';
import React from 'react';

import Web3 from 'web3';
import Footer from './components/Footer';
import Header from './components/Header';
import { Container, Row, Col } from './components/Base';

import { ROUTE_NAMES, router } from './lib/router';
import { NETWORK_NAMES } from './lib/network';
import {
  WALLET_NAMES,
  DEFAULT_HD_PATH,
  walletFromMnemonic,
  addressFromSecp256k1Public,
} from './lib/wallet';
import { BRIDGE_ERROR } from './lib/error';

const initWeb3 = networkType => {
  if (networkType === NETWORK_NAMES.MAINNET) {
    const endpoint = `https://mainnet.infura.io/v3/${
      process.env.REACT_APP_INFURA_ENDPOINT
    }`;

    const provider = new Web3.providers.HttpProvider(endpoint);
    const web3 = new Web3(provider);
    const contracts = azimuth.initContracts(web3, CONTRACT_ADDRESSES.MAINNET);
    return { web3: web3, contracts: contracts };
  } else if (networkType === NETWORK_NAMES.LOCAL) {
    const protocol = process.env.NODE_ENV === 'development' ? 'ws' : 'wss';
    const endpoint = `${protocol}://localhost:8545`;
    const provider = new Web3.providers.WebsocketProvider(endpoint);
    const web3 = new Web3(provider);
    const contracts = azimuth.initContracts(web3, CONTRACT_ADDRESSES.DEV);
    return { web3: web3, contracts: contracts };
  }
};

class Bridge extends React.Component {
  constructor(props) {
    super(props);

    const networkType =
      process.env.NODE_ENV === 'development'
        ? NETWORK_NAMES.LOCAL
        : NETWORK_NAMES.MAINNET;

    // Sidestepping full network selection to allow for point viewing,
    // but still respecting the networkType
    const { web3, contracts } = initWeb3(networkType);

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
      // routes
      routeCrumbs: Stack([ROUTE_NAMES.LANDING]),
      routeData: {},
      // network
      networkType: networkType,
      web3: Just(web3),
      contracts: Just(contracts),
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

    this.pushRoute = this.pushRoute.bind(this);
    this.popRoute = this.popRoute.bind(this);
    this.skipRoute = this.skipRoute.bind(this);
    this.setNetworkType = this.setNetworkType.bind(this);
    this.setNetwork = this.setNetwork.bind(this);
    this.setWalletType = this.setWalletType.bind(this);
    this.setWallet = this.setWallet.bind(this);
    this.setWalletHdPath = this.setWalletHdPath.bind(this);
    this.setUrbitWallet = this.setUrbitWallet.bind(this);
    this.setAuthMnemonic = this.setAuthMnemonic.bind(this);
    this.setPointCursor = this.setPointCursor.bind(this);
    this.setTxnHashCursor = this.setTxnHashCursor.bind(this);
    this.setTxnConfirmations = this.setTxnConfirmations.bind(this);
    this.setNetworkSeedCache = this.setNetworkSeedCache.bind(this);
    this.addToPointCache = this.addToPointCache.bind(this);
  }

  componentDidMount() {
    window.history.pushState(null, null, null);

    window.onpopstate = e => {
      window.history.pushState(null, null, null);
      this.popRoute();
    };

    // NB (jtobin):
    //
    // If running in development, the following can be tweaked to get you set
    // up with a desirable initial state.

    // if (process.env.NODE_ENV === 'development') {
    //
    //   const socket = 'ws://localhost:8545'
    //   const provider = new Web3.providers.WebsocketProvider(socket)
    //   const web3 = new Web3(provider)
    //   const contracts = azimuth.initContracts(web3, CONTRACT_ADDRESSES.DEV)
    //
    //   const mnemonic = process.env.REACT_APP_DEV_MNEMONIC
    //   const hdpath = process.env.REACT_APP_HD_PATH
    //
    //   this.setState({
    //     routeCrumbs: Stack([
    //       // ROUTE_NAMES.CREATE_GALAXY,
    //       // ROUTE_NAMES.SHIP,
    //       ROUTE_NAMES.SHIPS,
    //       // ROUTE_NAMES.MNEMONIC,
    //       ROUTE_NAMES.WALLET,
    //       ROUTE_NAMES.NETWORK,
    //       ROUTE_NAMES.LANDING
    //     ]),
    //     networkType: NETWORK_NAMES.LOCAL,
    //     pointCursor: Just(0),
    //     web3: Just(web3),
    //     contracts: Just(contracts),
    //     walletType: WALLET_NAMES.MNEMONIC,
    //     wallet: walletFromMnemonic(mnemonic, hdpath),
    //     urbitWallet: Nothing(),
    //     authMnemonic: Just('benefit crew supreme gesture quantum web media hazard theory mercy wing kitten')
    //   })
    // }
  }

  pushRoute(symbol, routeData) {
    if (lodash.includes(ROUTE_NAMES, symbol)) {
      this.setState((state, _) => ({
        routeCrumbs: state.routeCrumbs.push(symbol),
        routeData: routeData,
      }));

      // Scroll to top of page with each route transition.
      window.scrollTo(0, 0);
    } else {
      throw BRIDGE_ERROR.INVALID_ROUTE;
    }
  }

  skipRoute(len) {
    this.setState((state, _) => ({
      routeCrumbs: state.routeCrumbs.skip(len),
    }));
  }

  popRoute() {
    this.setState((state, _) => ({
      routeCrumbs: state.routeCrumbs.shift(),
    }));
  }

  setNetworkType(symbol) {
    if (lodash.includes(NETWORK_NAMES, symbol)) {
      this.setState({
        networkType: symbol,
      });
    } else {
      throw BRIDGE_ERROR.INVALID_NETWORK_TYPE;
    }
  }

  setNetworkSeedCache(networkSeed, revision) {
    this.setState({
      networkSeedCache: networkSeed,
      networkRevisionCache: revision,
    });
  }

  setNetwork(web3, contracts) {
    this.setState({
      web3: web3,
      contracts: contracts,
    });
  }

  setWalletType(symbol) {
    if (lodash.includes(WALLET_NAMES, symbol)) {
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

  setTxnConfirmations(txnHash, txnConfirmations) {
    this.setState((prevState, _) => {
      return prevState.routeCrumbs.peek() === ROUTE_NAMES.SENT_TRANSACTION
        ? {
            txnConfirmations: {
              ...prevState.txnConfirmations,
              [txnHash]: txnConfirmations,
            },
          }
        : null;
    });
  }

  render() {
    const {
      routeCrumbs,
      routeData,
      networkType,
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
      txnConfirmations,
      web3,
      contracts,
    } = this.state;

    const View = router(routeCrumbs.peek());

    // For the invite acceptance flow, widen the screen to use the full
    // container, and hide the breadcrumbs
    const colClass = routeCrumbs.contains(ROUTE_NAMES.INVITE_TICKET)
      ? 'col-md-12'
      : 'col-md-offset-1 col-md-10';

    const colStyle = routeCrumbs.contains(ROUTE_NAMES.INVITE_TICKET)
      ? {}
      : { maxWidth: '620px' };

    const showCrumbs = routeCrumbs.contains(ROUTE_NAMES.INVITE_TICKET)
      ? false
      : true;

    return (
      <Container>
        <Row>
          <Col className={colClass} style={colStyle}>
            <Header
              routeCrumbs={routeCrumbs}
              skipRoute={this.skipRoute}
              networkType={networkType}
              wallet={wallet}
              showCrumbs={showCrumbs}
              pointCursor={pointCursor}
            />

            <Row className={'row wrapper'}>
              <View
                // router
                pushRoute={this.pushRoute}
                popRoute={this.popRoute}
                routeData={routeData}
                // network
                setNetworkType={this.setNetworkType}
                setNetwork={this.setNetwork}
                networkType={networkType}
                web3={web3}
                contracts={contracts}
                // wallet
                setWalletType={this.setWalletType}
                setWalletHdPath={this.setWalletHdPath}
                setWallet={this.setWallet}
                walletType={walletType}
                walletHdPath={walletHdPath}
                wallet={wallet}
                // urbit wallet
                urbitWallet={urbitWallet}
                setUrbitWallet={this.setUrbitWallet}
                authMnemonic={authMnemonic}
                setAuthMnemonic={this.setAuthMnemonic}
                // point
                setPointCursor={this.setPointCursor}
                addToPointCache={this.addToPointCache}
                pointCursor={pointCursor}
                pointCache={pointCache}
                networkSeedCache={networkSeedCache}
                networkRevisionCache={networkRevisionCache}
                setNetworkSeedCache={this.setNetworkSeedCache}
                // txn
                onSent={this.setTxnHashCursor}
                setTxnHashCursor={this.setTxnHashCursor}
                txnHashCursor={txnHashCursor}
                setTxnConfirmations={this.setTxnConfirmations}
                txnConfirmations={txnConfirmations}
              />

              <div className={'push'} />
            </Row>

            <Footer />
          </Col>
        </Row>
      </Container>
    );
  }
}

export default Bridge;
