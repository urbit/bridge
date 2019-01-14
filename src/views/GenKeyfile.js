import React from 'react'

import { Button } from '../components/Base'
import { RequiredInput, InnerLabel } from '../components/Base'
import { Row, Col, H1, P } from '../components/Base'
import { Form, Code } from '../components/Base'

import * as ob from 'urbit-ob'
import * as kg from '../../node_modules/urbit-key-generation/dist/index'
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
      networkSeed: ''
    }

    this.handleNetworkSeedInput = this.handleNetworkSeedInput.bind(this)
    this.handleKeyfileChange = this.handleKeyfileChange.bind(this)
  }

  componentDidMount() {
    this.deriveSeed()
  }

  async deriveSeed() {
    const next = false
    const seed = await attemptSeedDerivation(next, this.props)
    this.setState({
      networkSeed: seed.getOrElse('')
    })
  }

  handleNetworkSeedInput = (networkSeed) => {
    this.setState({ networkSeed })
  }

  handleKeyfileChange = (keyfile) => {
    this.setState({ keyfile })
  }

  render() {
    const { pointCache } = this.props
    const { pointCursor } = this.props

    const { keyfile, networkSeed } = this.state

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

    const crypub = pointDetails.encryptionKey
    const sgnpub = pointDetails.authenticationKey

    const { crypt, auth } = kg.deriveNetworkKeys(networkSeed)

    const keysmatch =
         crypub === addHexPrefix(crypt.public)
      && sgnpub === addHexPrefix(auth.public)

    const warning =
        keyfile !== '' && keysmatch === false
      ? <Row>
          <Col>
            <b>{ 'WARNING' }</b>{ ": derived key doesn't match Azimuth keys!"  }
          </Col>
        </Row>
      : <div />

    const hexRegExp = /[0-9A-Fa-f]{64}/g

    const download =
        keyfile !== ''
      ? <Button
          onClick={
            () => {
              let blob = new Blob([keyfile], {type:"text/plain;charset=utf-8"});
              saveAs(blob, `${ob.patp(point).slice(1)}-${revision}.key`)
            }
          }>
          Download →
        </Button>
      : ''

    return (
      <Row>
        <Col className={'col-md-8'}>
          <H1>{ 'Generate keyfile' }</H1>

          <P>
          { "Generate a private key file for booting this point in Arvo." }
          </P>

          <P>
          {
            `Enter a network seed below for generating your key file.  Your
             network seed must be a 32-byte-long hexadecimal string.`
          }
          </P>
          <P>
          {
             `If you've authenticated with either a master ticket or a
             management proxy mnemonic, a seed will be generated for you
             automatically.`
          }
          </P>

          <Form>
            <RequiredInput
              className='mono'
              prop-size='lg'
              prop-format='innerLabel'
              autoFocus
              value={ networkSeed }
              onChange={ this.handleNetworkSeedInput }>
              <InnerLabel>{ 'Network seed' }</InnerLabel>
            </RequiredInput>

            <Button
              className={'mt-8'}
              color={'blue'}
              onClick={
                () => {
                  if (hexRegExp.test(networkSeed)) {
                    const keyfile = genKey(networkSeed, point, revision)
                    this.setState({ keyfile })
                  }
                }
              }
            >
              { 'Generate  →' }
            </Button>
          </Form>

          <Code>
            { keyfile }
          </Code>

          { warning }

          { download }

        </Col>
      </Row>
    )
  }

}

export default GenKeyfile
