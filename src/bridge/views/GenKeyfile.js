import React from 'react'
import Maybe from 'folktale/maybe'

import { Button } from '../components/Base'
import { Row, Col, H1, P } from '../components/Base'

import * as ob from 'urbit-ob'
import * as kg from '../../../node_modules/urbit-key-generation/dist/index'
import saveAs from 'file-saver'

import { attemptSeedDerivation, genKey } from '../lib/keys'
import { BRIDGE_ERROR } from '../lib/error'
import {
  addHexPrefix
  } from '../lib/wallet'

class GenKeyfile extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      keyfile: '',
      loaded: false
    }
  }

  getPointDetails() {
    const { pointCache } = this.props
    const { pointCursor } = this.props

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

    const revision = parseInt(pointDetails.keyRevisionNumber)

    return {
      point,
      pointDetails,
      revision
    }
  }

  async componentDidMount() {
    const { point, pointDetails, revision } = this.getPointDetails();
    let keyfile = ''

    const hexRegExp = /[0-9A-Fa-f]{64}/g
    const networkSeed = await this.deriveSeed()

    const keysmatch = this.checkKeysMatch(networkSeed, pointDetails)
    const seedValid = hexRegExp.test(networkSeed)

    if (keysmatch && seedValid) {
      keyfile = genKey(networkSeed, point, revision)
    }

    this.setState({
      keyfile: keyfile,
      loaded: true
    });
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
    let seed = await attemptSeedDerivation(next, this.props)

    if (seed.getOrElse('') === '' && this.props.networkSeedCache) {
      seed = Maybe.Just(this.props.networkSeedCache)
    }

    return seed.getOrElse('')
  }

  render() {
    const { point, revision } = this.getPointDetails();
    const { keyfile, loaded } = this.state

    return (
      <Row>
        <Col className={'col-md-8'}>
          <H1>{ 'Generate keyfile' }</H1>

          <P>
          { "Download a private key file for booting this point in Arvo." }
          </P>

          { keyfile === '' && !loaded &&
            <P>
              { "Generating keyfile..." }
            </P>
          }

          { keyfile === '' && loaded &&
            <React.Fragment>
              <P>
                <b>Warning: </b>
                { `No valid network seed detected. To generate a keyfile, you
                  must reset your networking keys, or try logging in with your
                  master ticket or management mnemonic.` }
              </P>

              <P>
                { `If you've just reset your networking keys, you may need to wait for the transaction to go through. Check back shortly.` }
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
