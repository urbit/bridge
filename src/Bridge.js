import Maybe from 'folktale/maybe'
import * as lodash from 'lodash'
import { Stack } from 'immutable'
import React from 'react'

import Footer from './components/Footer'
import Header from './components/Header'
import { Container, Row, Col } from './components/Base'

import { ROUTE_NAMES, router } from './lib/router'
import { NETWORK_NAMES } from './lib/network'
import { WALLET_NAMES, DEFAULT_HD_PATH } from './lib/wallet'
import { BRIDGE_ERROR } from './lib/error'

class Bridge extends React.Component {

  constructor(props) {
    super(props)

    const networkType =
        process.env.NODE_ENV === 'development'
      ? NETWORK_NAMES.LOCAL
      : NETWORK_NAMES.MAINNET

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
      routeCrumbs: Stack([ ROUTE_NAMES.LANDING ]),
      // network
      networkType: networkType,
      web3: Maybe.Nothing(),
      contracts: Maybe.Nothing(),
      // wallet
      walletType: WALLET_NAMES.MNEMONIC,
      wallet: Maybe.Nothing(),
      walletHdPath: DEFAULT_HD_PATH,
      // urbit wallet-related
      urbitWallet: Maybe.Nothing(),
      authMnemonic: Maybe.Nothing(),
      // point
      pointCursor: Maybe.Nothing(),
      pointCache: {},
      // txn
      txnCursor: Maybe.Nothing()
    }

    this.pushRoute = this.pushRoute.bind(this)
    this.popRoute = this.popRoute.bind(this)
    this.skipRoute = this.skipRoute.bind(this)
    this.setNetworkType = this.setNetworkType.bind(this)
    this.setNetwork = this.setNetwork.bind(this)
    this.setWalletType = this.setWalletType.bind(this)
    this.setWallet = this.setWallet.bind(this)
    this.setWalletHdPath = this.setWalletHdPath.bind(this)
    this.setUrbitWallet = this.setUrbitWallet.bind(this)
    this.setAuthMnemonic = this.setAuthMnemonic.bind(this)
    this.setPointCursor = this.setPointCursor.bind(this)
    this.setTxnCursor = this.setTxnCursor.bind(this)
    this.addToPointCache = this.addToPointCache.bind(this)
  }

  componentDidMount() {

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
  //       ROUTE_NAMES.CREATE_GALAXY,
  //       ROUTE_NAMES.SHIPS,
  //       // ROUTE_NAMES.MNEMONIC,
  //       ROUTE_NAMES.WALLET,
  //       ROUTE_NAMES.NETWORK,
  //       ROUTE_NAMES.LANDING
  //     ]),
  //     networkType: NETWORK_NAMES.LOCAL,
  //     web3: Maybe.Just(web3),
  //     contracts: Maybe.Just(contracts),
  //     walletType: WALLET_NAMES.MNEMONIC,
  //     wallet: walletFromMnemonic(mnemonic, hdpath),
  //     urbitWallet: Maybe.Nothing(),
  //     authMnemonic: Maybe.Nothing()
  //   })
  // }
}

  pushRoute(symbol) {
    if (lodash.includes(ROUTE_NAMES, symbol)) {
      this.setState((state, _) => ({
        routeCrumbs: state.routeCrumbs.push(symbol),
      }));

      // Scroll to top of page with each route transition.
      window.scrollTo(0, 0);

    } else {
      throw BRIDGE_ERROR.INVALID_ROUTE
    }
  }

  skipRoute(len) {
    this.setState((state, _) => ({
      routeCrumbs: state.routeCrumbs.skip(len)
    }))
  }

  popRoute() {
    this.setState((state, _) => ({
      routeCrumbs: state.routeCrumbs.shift()
    }))3
  }

  setNetworkType(symbol) {
    if (lodash.includes(NETWORK_NAMES, symbol)) {
      this.setState({
        networkType: symbol
      })
    } else {
      throw BRIDGE_ERROR.INVALID_NETWORK_TYPE
    }
  }

  setNetwork(web3, contracts) {
    this.setState({
      web3: web3,
      contracts: contracts
    })
  }

  setWalletType(symbol) {
    if (lodash.includes(WALLET_NAMES, symbol)) {
      this.setState({
        walletType: symbol
      })
    } else {
      throw BRIDGE_ERROR.INVALID_WALLET_TYPE
    }
  }

  setWallet(wallet) {
    this.setState({ wallet })
  }

  setWalletHdPath(walletHdPath) {
    this.setState({ walletHdPath })
  }

  setUrbitWallet(urbitWallet) {
    this.setState({ urbitWallet })
  }

  setAuthMnemonic(authMnemonic) {
    this.setState({ authMnemonic })
  }

  setPointCursor(pointCursor) {
    this.setState({ pointCursor })
  }

  addToPointCache(entry) {
    this.setState((state, _) => ({
      pointCache: Object.assign(state.pointCache, entry)
    }))
  }

  setTxnCursor(txn) {
    this.setState({
      txnCursor: txn
    })
  }

  render() {
    const {
      routeCrumbs,
      networkType,
      walletType,
      walletHdPath,
      wallet,
      urbitWallet,
      authMnemonic,
      pointCursor,
      pointCache,
      txnCursor,
      web3,
      contracts
    } = this.state

    const View = router(routeCrumbs.peek())

    return (
      <Container>
      <Row>
        <Col className='col-md-1' />
          <Col className='col-md-10' style={{maxWidth: '620px'}}>
            <Header
              routeCrumbs={ routeCrumbs }
              skipRoute={ this.skipRoute }
              networkType={ networkType }
              wallet={ wallet }
              pointCursor={ pointCursor } />

            <Row className={ 'row wrapper' }>

              <View
                // router
                pushRoute={ this.pushRoute }
                popRoute={ this.popRoute }
                // network
                setNetworkType={ this.setNetworkType }
                setNetwork={ this.setNetwork }
                networkType={ networkType }
                web3={ web3 }
                contracts={ contracts }
                // wallet
                setWalletType={ this.setWalletType }
                setWalletHdPath={ this.setWalletHdPath }
                setWallet={ this.setWallet }
                walletType={ walletType }
                walletHdPath={ walletHdPath }
                wallet={ wallet }
                // urbit wallet
                urbitWallet={ urbitWallet }
                setUrbitWallet={ this.setUrbitWallet }
                authMnemonic={ authMnemonic }
                setAuthMnemonic={ this.setAuthMnemonic }
                // point
                setPointCursor={ this.setPointCursor }
                addToPointCache={ this.addToPointCache }
                pointCursor={ pointCursor }
                pointCache={ pointCache }
                // txn
                setTxnCursor={ this.setTxnCursor }
                txnCursor={ txnCursor } />

              <div className={'push'} />

            </Row>

            <Footer />
          </Col>
        </Row>
      </Container>
    )
  }
}

export default Bridge
