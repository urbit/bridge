import React from 'react'
import Maybe from 'folktale/maybe'

import { Button, RequiredInput, InnerLabel } from '../components/Base'
import { Row, Col, H1, P } from '../components/Base'

import * as ob from 'urbit-ob'
import * as kg from '../../../node_modules/urbit-key-generation/dist/index'
import saveAs from 'file-saver'

import { attemptSeedDerivation, genKey } from '../lib/keys'
import { NETWORK_NAMES } from '../lib/network'
import { BRIDGE_ERROR } from '../lib/error'
import {
  addHexPrefix,
  WALLET_NAMES
} from '../lib/wallet'

class GenKeyfile extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      keyfile: '',
      loaded: false,
      revisionNumber: ''
    }

    this.genKeyfile = this.genKeyfile.bind(this)
    this.handleRevisionNumber = this.handleRevisionNumber.bind(this)
  }

  handleRevisionNumber(num) {
    this.setState({
      revisionNumber: num
    })
  }

  getPointDetails() {
    const { pointCache, pointCursor, networkType } = this.props

    const point = pointCursor.matchWith({
      Just: (pt) => pt.value,
      Nothing: () => {
        throw BRIDGE_ERROR.MISSING_POINT
      }
    })

    const pointDetails =
        point in pointCache
      ? pointCache[point]
      : (() => { throw BRIDGE_ERROR.MISSING_POINT })()

    const revision = parseInt(pointDetails.keyRevisionNumber, 10)

    return {
      point,
      pointDetails,
      revision
    }
  }

  offlineKeygenAvailable() {
    const isOffline = this.props.networkType === NETWORK_NAMES.OFFLINE

    const isUrbitWallet = this.props.walletType === WALLET_NAMES.TICKET ||
                          this.props.walletType === WALLET_NAMES.SHARDS ||
                          this.props.walletType === WALLET_NAMES.MNEMONIC

    return isOffline && isUrbitWallet
  }

  async genKeyfile() {
    const { point, pointDetails, revision } = this.getPointDetails();
    let keyfile = ''

    const hexRegExp = /[0-9A-Fa-f]{64}/g
    const networkSeed = await this.deriveSeed()

    const keysmatch = this.offlineKeygenAvailable()
                      ? true
                      : this.checkKeysMatch(networkSeed, pointDetails)

    const seedValid = hexRegExp.test(networkSeed)

    if (keysmatch && seedValid) {
      keyfile = genKey(networkSeed, point, revision)
    }

    this.setState({
      keyfile: keyfile,
      loaded: true
    });
  }

  async componentDidMount() {
    this.genKeyfile()
  }

  checkKeysMatch(networkSeed, pointDetails) {
    const crypub = pointDetails.encryptionKey
    const sgnpub = pointDetails.authenticationKey

    const { crypt, auth } = kg.deriveNetworkKeys(networkSeed)

    const keysmatch =
         crypub === addHexPrefix(crypt.public)
      && sgnpub === addHexPrefix(auth.public)

    return keysmatch;
  }

  async deriveSeed() {
    const next = false

    let seed;

    if (this.offlineKeygenAvailable() && this.state.revisionNumber !== '') {
      seed = await attemptSeedDerivation(next, this.props, parseInt(this.state.revisionNumber, 10))
    } else {
      seed = await attemptSeedDerivation(next, this.props)
    }

    if (seed.getOrElse('') === '' && this.props.networkSeedCache) {
      seed = Maybe.Just(this.props.networkSeedCache)
    }

    return seed.getOrElse('')
  }

  render() {
    const { point, revision } = this.getPointDetails();
    const { keyfile, loaded, revisionNumber } = this.state

    return (
      <Row>
        <Col className={'col-md-8'}>
          <H1>{ 'Generate keyfile' }</H1>

          <P>
          { "Download a private key file for booting this point in Arvo." }
          </P>

          { this.offlineKeygenAvailable() &&
            <React.Fragment>
              <RequiredInput
                className='pt-8 mt-8'
                prop-size='md'
                prop-format='innerLabel'
                name='revisionNumber'
                onChange={ this.handleRevisionNumber }
                value={ revisionNumber }
                autocomplete='off'
                autoFocus>
                <InnerLabel>{'Revision Number'}</InnerLabel>
              </RequiredInput>
              <Button
                className={ 'mt-4 mb-4' }
                disabled={ this.state.revisionNumber === '' }
                prop-size={ 'md' }
                onClick={ this.genKeyfile }
              >
                { 'Generate' }
              </Button>
            </React.Fragment>
          }

          { keyfile === '' && !loaded &&
            <P>
              { "Generating keyfile..." }
            </P>
          }

          { keyfile === '' && loaded && !this.offlineKeygenAvailable() &&
            <React.Fragment>
              <P>
                <b>Warning: </b>
                { `No valid network seed detected. To generate a keyfile, you
                  must reset your networking keys, or try logging in with your
                  master ticket or management mnemonic.` }
              </P>

              <P>
                <span>If you've just reset your networking keys, you may need to wait for the transaction to go through. Click</span>
                <span className="text-link" onClick={this.genKeyfile}>here</span>
                <span>to refresh</span>
              </P>
            </React.Fragment>
          }

          { keyfile !== '' &&
            <React.Fragment>
              <div className="pb-5 text-code keyfile">
                { keyfile }
              </div>
              <Button
                  onClick={
                    () => {
                      let blob = new Blob([keyfile], {type:"text/plain;charset=utf-8"});
                      saveAs(blob, `${ob.patp(point).slice(1)}-${revision}.key`)
                    }
                  }>
                  Download →
                </Button>
            </React.Fragment>
          }

        </Col>
      </Row>
    )
  }

}

export default GenKeyfile
