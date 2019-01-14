import * as bip32 from 'bip32'
import React from 'react'
import Maybe from 'folktale/maybe'
import { Button } from '../components/Base'
import { Row, Col, H1, P, H2 } from '../components/Base'
import Transport from '@ledgerhq/hw-transport-u2f'
import Eth from '@ledgerhq/hw-app-eth'
import * as secp256k1 from 'secp256k1'

import { LEDGER_BASE_PATH } from '../lib/ledger'
import { ROUTE_NAMES } from '../lib/router'

class Ledger extends React.Component {

  componentDidMount() {
    this.pollDevice()

    this.pollerId = setInterval(
      () => this.pollDevice(),
      500
    )
  }

  componentWillUnmount() {
    clearInterval(this.pollerId)
  }

  async pollDevice() {
    const { wallet, setWallet } = this.props

    if (Maybe.Nothing.hasInstance(wallet)) {
      const transport = await Transport.create()
      const eth = new Eth(transport)

      eth.getAddress(LEDGER_BASE_PATH, false, true)
        .then(info => {
            const publicKey = Buffer.from(info.publicKey, 'hex')
            const chainCode = Buffer.from(info.chainCode, 'hex')
            const pub = secp256k1.publicKeyConvert(publicKey, true)
            const hd = bip32.fromPublicKey(pub, chainCode)
            setWallet(Maybe.Just(hd))
          }, _ => {
            setWallet(Maybe.Nothing())
          })
    }
  }

  render() {
    const { pushRoute, popRoute, wallet } = this.props

    return (

        <Row>
          <Col>
            <H1>{ 'Authenticate With Your Ledger' }</H1>

            <H2>{'Running on HTTPS?'}</H2>

            <P>
              { `Connect and authenticate to your Ledger, and then open the
                "Ethereum" application. If you're running on older firmware, make sure the browser
                support" option is turned on.` }
            </P>


            <H2>{'Running on HTTP?'}</H2>

            <P>{`To authenticate and sign transactions with a Ledger, Bridge
              must be serving over HTTPS on localhost. You can do this via the
              following:`}</P>

            <ol className={'measure-md'}>
              <li className={'mt-4'}>{'Install'} <a target={'_blank'} href={'https://github.com/FiloSottile/mkcert'}>{'mkcert'}</a></li>
              <li className={'mt-4'}>{'Install a local certificate authority via '}<code>{'mkcert -install'}</code></li>
              <li className={'mt-4'}>{'In your '}<code>{'bridge'}</code>{' directory, generate a certificate valid for localhost via '} <code>{'mkcert localhost'}</code>{'.'}
                {'This will produce two files: '}<code>{'localhost.pem'}</code> {', the local certificate, and '}<code>{'localhost-key.pem'}</code>{', its corresponding private key.'}
              </li>
              <li className={'mt-4'}>{'Run '}<code>{'python bridge-https.py'}</code></li>
            </ol>


          <Button
            className={'mt-8'}
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

export default Ledger
