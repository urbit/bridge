import Maybe from 'folktale/maybe'
import React from 'react'
import * as keythereum from 'keythereum'
import { Button } from '../components/Base'
import { Input, InnerLabel, InputCaption } from '../components/Base'
import { Row, Col, H1, Form } from '../components/Base'

import { ROUTE_NAMES } from '../lib/router'
import { EthereumWallet } from '../lib/wallet'
import UploadButton from '../components/UploadButton'

class Keystore extends React.Component {

  constructor(props) {
    super(props)

    this.state = {
      keystore: '',
      password: ''
    }

    this.handleKeystoreInput = this.handleKeystoreInput.bind(this)
    this.handlePasswordInput = this.handlePasswordInput.bind(this)
    this.constructWallet = this.constructWallet.bind(this)
  }

  handleKeystoreInput(keystore) {
    this.setState({ keystore })
  }

  handlePasswordInput(password) {
    this.setState({ password })
  }

  constructWallet() {
    const { setWallet } = this.props
    const { keystore, password } = this.state

    try {
      const json = JSON.parse(keystore)
      const privateKey = keythereum.recover(password, json)
      const wallet = new EthereumWallet(privateKey)
      setWallet(Maybe.Just(wallet))
    } catch (err) {
      setWallet(Maybe.Nothing())
    }
  }

  handleKeystoreUpload = (event) => {
    const file = event.files.item(0)
    const reader = new FileReader()

    reader.readAsText(file)

    console.log(reader.readyState)

    // const loop = arg =>
    //     arg.readyState === 2
    //   ? arg.result
    //   : loop(arg)

    // const keystore = loop(reader)
    // this.setState({ keystore })
  }

  render() {
    const { pushRoute, popRoute, wallet } = this.props
    const { keystore, password } = this.state

    const keystoreInput =
      <Input
        className='pt-8 mt-8'
        prop-size='md'
        prop-format='innerLabel'
        type='text'
        name='keystore'
        onChange={ this.handleKeystoreInput }
        value={ keystore }
        autocomplete='off'
        autoFocus>
        <InnerLabel>{'Keystore File'}</InnerLabel>
      </Input>

    return (
        <Row>
          <Col className={'measure-md'}>
            <H1 className={'mb-4'}>{ 'Enter Your Keystore File' }</H1>
            <Form>
            <InputCaption>
            { `Please paste in your Ethereum keystore file.  If your keystore
               file is encrypted with a password, you'll also need to enter
               that below.` }
            </InputCaption>

            <UploadButton
              className={ `btn btn-primary table mt-4` }
              onChange={ this.handleKeystoreUpload }
            >
              { 'Upload Keystore file' }
            </UploadButton>

            <Input
              className='pt-8 mt-8'
              prop-size='md'
              prop-format='innerLabel'
              type='password'
              name='password'
              onChange={ this.handlePasswordInput }
              value={ password }
              autocomplete='off'
              autoFocus>
              <InnerLabel>{'Password'}</InnerLabel>
            </Input>

            <Button
              className={'mt-10'}
              prop-size={ 'wide lg' }
              disabled={ keystore === '' }
              onClick={ this.constructWallet }
            >
              { 'Decrypt' }
            </Button>

            <Button
              className={'mt-10'}
              prop-size={ 'wide lg' }
              disabled={ Maybe.Nothing.hasInstance(wallet) }
              onClick={ () => {
                  popRoute()
                  pushRoute(ROUTE_NAMES.SHIPS)
                }
              }
            >
              { 'Continue →' }
            </Button>

            </Form>
          </Col>
        </Row>


    )
  }
}

export default Keystore
