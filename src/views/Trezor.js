import * as bip32 from 'bip32'
import React from 'react'
import Maybe from 'folktale/maybe'
import { Button } from '../components/Base'
import { Row, Col, H1, P } from '../components/Base'
import { InnerLabel, Input } from '../components/Base'
import TrezorConnect from 'trezor-connect'
import * as secp256k1 from 'secp256k1'

import { TREZOR_BASE_PATH } from '../lib/trezor'
import { ROUTE_NAMES } from '../lib/router'

class Trezor extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      hdpath: TREZOR_BASE_PATH
    }

    this.handleHdPathInput = this.handleHdPathInput.bind(this)
    this.pollDevice = this.pollDevice.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
  }

  handleHdPathInput(hdpath) {
    this.setState({ hdpath })
  }

  async pollDevice() {
    const { setWallet, setWalletHdPath } = this.props
    const { hdpath } = this.state

    TrezorConnect.getPublicKey({ path: hdpath })
      .then(info => {
        if (info.success === true) {
          const payload = info.payload
          const publicKey = Buffer.from(payload.publicKey, 'hex')
          const chainCode = Buffer.from(payload.chainCode, 'hex')
          const pub = secp256k1.publicKeyConvert(publicKey, true)
          const hd = bip32.fromPublicKey(pub, chainCode)
          setWallet(Maybe.Just(hd))
          setWalletHdPath(hdpath)
        } else {
          setWallet(Maybe.Nothing())
        }
      })
  }

  handleSubmit() {
    const { props } = this
    props.popRoute()
    props.pushRoute(ROUTE_NAMES.SHIPS)
  }

  render() {
    const { props, state } = this

    return (
        <Row>
          <Col className={'measure-lg'}>
            <H1>{ 'Authenticate With Your Trezor' }</H1>

            <P>
              { `Connect and authenticate to your Trezor.  If you'd like
                to use a custom derivation path, you may enter it below.`
              }
            </P>

            <Input
              className='pt-8'
              prop-size='md'
              prop-format='innerLabel'
              name='hdpath'
              value={ state.hdpath }
              autocomplete='off'
              onChange={ this.handleHdPathInput }>
              <InnerLabel>{'HD Path'}</InnerLabel>
            </Input>

            <Button
              className={'mt-8'}
              prop-size={'wide lg'}
              onClick={ this.pollDevice }>
              { 'Authenticate →' }
            </Button>

            <Row className={'mt-8 '}>
              <Button
                prop-size={'lg wide'}
                disabled={ Maybe.Nothing.hasInstance(props.wallet) }
                onClick={ this.handleSubmit }>
                { 'Continue →' }
              </Button>

              <Button
                prop-type={'link'}
                className={'mt-8'}
                onClick={ () => props.popRoute() }>
                { '← Back' }
              </Button>
            </Row>

        </Col>
      </Row>
    )
  }
}

export default Trezor
