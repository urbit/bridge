import * as bip39 from 'bip39'
import Maybe from 'folktale/maybe'
import React from 'react'
import { Button } from '../components/Base'
import { Input, MnemonicInput, InnerLabel, InputCaption } from '../components/Base'
import { Row, Col, H1 } from '../components/Base'

import { ROUTE_NAMES } from '../lib/router'
import { DEFAULT_HD_PATH, walletFromMnemonic } from '../lib/wallet'


class Mnemonic extends React.Component {

  constructor(props) {
    super(props)

    this.state = {
      mnemonic: '',
      passphrase: '',
      exampleMnemonic: bip39.generateMnemonic(),
      hdpath: DEFAULT_HD_PATH,
    }

    this.handleMnemonicInput = this.handleMnemonicInput.bind(this)
    this.handleHdPathInput = this.handleHdPathInput.bind(this)
    this.handlePassphrase = this.handlePassphrase.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
  }


  handleMnemonicInput(mnemonic) {
    this.setState({ mnemonic })
  }

  handleHdPathInput(hdpath) {
    this.setState({ hdpath })
  }

  handlePassphrase(passphrase) {
    this.setState({ passphrase })
  }

  handleSubmit() {
    const { state, props } = this

    const wallet = walletFromMnemonic(
      state.mnemonic,
      state.hdpath === '' ? DEFAULT_HD_PATH : state.hdpath,
      state.passphrase
    )
    props.setWallet(wallet)
    props.setAuthMnemonic(Maybe.Just(state.mnemonic))

    props.popRoute()
    props.pushRoute(ROUTE_NAMES.SHIPS)
  }

  render() {
    const { props, state } = this

    const isValidMnemonic = bip39.validateMnemonic(state.mnemonic)
    const canSubmit = isValidMnemonic

    return (
        <Row>
          <Col>
            <H1 className={'mb-4'}>{ 'Enter Your Mnemonic' }</H1>

            <InputCaption>
            { "Please enter your BIP39 mnemonic here." }
            </InputCaption>

            <MnemonicInput
              className='pt-8'
              prop-size='md'
              prop-format='innerLabel'
              type='text'
              name='mnemonic'
              placeholder={ `e.g. ${state.exampleMnemonic}` }
              onChange={ this.handleMnemonicInput }
              value={ state.mnemonic }
              autocomplete='off'>
              <InnerLabel>{'Mnemonic'}</InnerLabel>
            </MnemonicInput>

            <InputCaption>
            {`If your wallet requires a passphrase you may enter it below.`}
            </InputCaption>

            <Input
              className='pt-8'
              prop-size='md'
              prop-format='innerLabel'
              name='passphrase'
              type='password'
              value={ state.passphrase }
              autocomplete='off'
              onChange={ this.handlePassphrase }>
              <InnerLabel>{'Passphrase'}</InnerLabel>
            </Input>

            <InputCaption>
              {`If you'd like to use a custom derivation path, you may enter it
               below.`}
            </InputCaption>

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

            <Row className={'mt-8 '}>
              <Button
                prop-size={'lg wide'}
                disabled={!canSubmit}
                onClick={ this.handleSubmit }>
                { 'Unlock →' }
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

export default Mnemonic
