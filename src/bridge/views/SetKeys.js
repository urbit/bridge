import React from 'react'
import Maybe from 'folktale/maybe'
import * as azimuth from 'azimuth-js'
import * as ob from 'urbit-ob'
import { Row, Col, H1, P, Warning } from '../components/Base'

import StatelessTransaction from '../components/StatelessTransaction'
import { BRIDGE_ERROR } from '../lib/error'
import { attemptSeedDerivation } from '../lib/keys'

import * as kg from '../../../node_modules/urbit-key-generation/dist/index'

import {
  addressFromSecp256k1Public,
  addHexPrefix
} from '../lib/wallet'

class SetKeys extends React.Component {
  constructor(props) {
    super(props)

    const point = props.pointCursor.matchWith({
      Just: (shp) => shp.value,
      Nothing: () => {
        throw BRIDGE_ERROR.MISSING_POINT
      }
    })

    this.state = {
      auth: '',
      encr: '',
      networkSeed: '',
      nondeterministicSeed: false,
      point: point,
      cryptoSuiteVersion: 1,
      continuity: false,
      isManagementSeed: false,
    }

    // Transaction
    this.createUnsignedTxn = this.createUnsignedTxn.bind(this)
  }

  componentDidMount() {
    const { props } = this

    this.deriveSeed()

    const addr = props.wallet.matchWith({
      Just: wal => addressFromSecp256k1Public(wal.value.publicKey),
      Nothing: () => {
        throw BRIDGE_ERROR.MISSING_WALLET
      }
    })

    this.determineManagementSeed(props.contracts.value, addr)
  }

  async determineManagementSeed(ctrcs, addr) {
    const managing =
      await azimuth.azimuth.getManagerFor(ctrcs, addr)

    this.setState({
      isManagementSeed: managing.length !== 0
    })
  }

  //TODO use web3.utils.randomHex when it gets fixed, see web3.js#1490
  randomHex(len) {
    let hex = "";

    for (var i = 0; i < len; i++) {
      hex = hex + ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B',
      'C', 'D', 'E', 'F'][Math.floor(Math.random() * 16)]
    }

    return hex;
  }

  async deriveSeed() {
    const next = true
    let seed = await attemptSeedDerivation(next, this.props)
    let nondeterministicSeed = false;

    if (seed.getOrElse('') === '') {
      seed = Maybe.Just(this.randomHex(64));
      nondeterministicSeed = true;
    }

    this.setState({
      networkSeed: seed.getOrElse(''),
      nondeterministicSeed: nondeterministicSeed
    })
  }

  createUnsignedTxn() {
    const { state, props } = this

    const validContracts = props.contracts.matchWith({
      Just: (cs) => cs.value,
      Nothing: () => {
        throw BRIDGE_ERROR.MISSING_CONTRACTS
      }
    })

    const validPoint = props.pointCursor.matchWith({
      Just: (shp) => shp.value,
      Nothing: () => {
        throw BRIDGE_ERROR.MISSING_POINT
      }
    })

    const hexRegExp = /[0-9A-Fa-f]{64}/g

    if (hexRegExp.test(state.networkSeed)) {
      // derive network keys
      const pair = kg.deriveNetworkKeys(state.networkSeed)

      const pencr = addHexPrefix(pair.crypt.public)
      const pauth = addHexPrefix(pair.auth.public)

      const txn = azimuth.ecliptic.configureKeys(
        validContracts,
        validPoint,
        pencr,
        pauth,
        1,
        false
      )

      return Maybe.Just(txn)
    }

    return Maybe.Nothing()
  }

  render() {
    const { props, state } = this

    const canGenerate =
         state.networkSeed.length === 64
      && state.networkSeed.length === 64

    const pointDetails =
        state.point in props.pointCache
      ? props.pointCache[state.point]
      : (() => { throw BRIDGE_ERROR.MISSING_POINT })()

    return (
      <Row>
        <Col>
          <H1>
            { 'Set Network Keys For ' } <code>{ `${ob.patp(state.point)}` }</code>
          </H1>

          <P className="mt-10">
          {
            `Set new authentication and encryption keys for your Arvo ship.`
          }
          </P>

          { state.nondeterministicSeed &&
            <Warning>
              <h3 className={'mb-2'}>{'Warning'}</h3>
              {
                `Your network seed could not be derived automatically. We've
                generated a random one for you, so you must download your Arvo
                keyfile during this session after setting your keys.`
              }
            </Warning>
          }

          { pointDetails.keyRevisionNumber === '0'
            ? <Warning>
                <h3 className={'mb-2'}>{'Warning'}</h3>
                {
                  'Once these keys have been set, your point is considered ' +
                  "'linked'.  This operation cannot be undone."
                }
              </Warning>
            : <div /> }

          <StatelessTransaction
            // Upper scope
            web3={props.web3}
            contracts={props.contracts}
            wallet={props.wallet}
            walletType={props.walletType}
            walletHdPath={props.walletHdPath}
            networkType={props.networkType}
            setTxnHashCursor={props.setTxnHashCursor}
            setTxnConfirmations={props.setTxnConfirmations}
            popRoute={props.popRoute}
            pushRoute={props.pushRoute}
            // Tx
            canGenerate={ canGenerate }
            createUnsignedTxn={this.createUnsignedTxn}
            networkSeed={ state.networkSeed }
            setNetworkSeedCache={ props.setNetworkSeedCache } />

        </Col>
      </Row>
    )
  }
}

export default SetKeys
