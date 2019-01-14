import * as bip32 from 'bip32'
import React from 'react'
import Maybe from 'folktale/maybe'
import { Button } from '../components/Base'
import { Row, Col, H1, P } from '../components/Base'
import TrezorConnect from 'trezor-connect'
import * as secp256k1 from 'secp256k1'

import { TREZOR_BASE_PATH } from '../lib/trezor'
import { ROUTE_NAMES } from '../lib/router'

class Trezor extends React.Component {

  componentDidMount() {
    this.pollDevice()
  }

  async pollDevice() {
    const { wallet, setWallet } = this.props

    if (Maybe.Nothing.hasInstance(wallet)) {
      TrezorConnect.getPublicKey({ path: TREZOR_BASE_PATH })
        .then(info => {
          if (info.success === true) {
            const payload = info.payload
            const publicKey = Buffer.from(payload.publicKey, 'hex')
            const chainCode = Buffer.from(payload.chainCode, 'hex')
            const pub = secp256k1.publicKeyConvert(publicKey, true)
            const hd = bip32.fromPublicKey(pub, chainCode)
            setWallet(Maybe.Just(hd))
          } else {
            setWallet(Maybe.Nothing())
          }
        })
    }
  }

  render() {
    const { pushRoute, popRoute, wallet } = this.props

    return (

        <Row>
          <Col>
            <H1>{ 'Authenticate With Your Trezor' }</H1>

            <P>
              { 'Connect and authenticate to your Trezor.  If the Trezor ' +
                'popup window does not display, reconnect your Trezor and ' +
                'navigate back to this page.'
              }
            </P>

          <Button
            disabled={ Maybe.Nothing.hasInstance(wallet) }
            onClick={
              () => {
                popRoute()
                pushRoute(ROUTE_NAMES.SHIPS)
              }
            }
          >
            { 'Continue →' }
          </Button>

        </Col>
      </Row>
    )
  }
}

export default Trezor

