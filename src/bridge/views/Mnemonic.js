import * as bip39 from 'bip39'
import { Just, Nothing } from 'folktale/maybe'
import React from 'react'
import { Button } from '../components/Base'
import {
  Input,
  MnemonicInput,
  InnerLabel,
  InputCaption
  } from '../components/Base'
import { Row, Col, H1 } from '../components/Base'

import { ROUTE_NAMES } from '../lib/router'
import { DEFAULT_HD_PATH, walletFromMnemonic } from '../lib/wallet'


class Mnemonic extends React.Component {

  constructor(props) {
    super(props)

    this.state = {
      mnemonic: '',
      hdpath: DEFAULT_HD_PATH,
    }

    this.handleMnemonicInput = this.handleMnemonicInput.bind(this)
    this.handleHdPathInput = this.handleHdPathInput.bind(this)
  }

  componentDidMount() {
    const { mnemonic, hdpath } = this.state
    this.attemptWalletDerivation(mnemonic, hdpath)

    this.setState({
      exampleMnemonic: bip39.generateMnemonic(),
    })
  }

  handleMnemonicInput(mnemonic) {
    this.setState((state, _) => {
      const hdpath = state.hdpath
      this.attemptWalletDerivation(
        mnemonic,
        hdpath === '' ? DEFAULT_HD_PATH : hdpath
      )
      return {
        mnemonic
      }
    })
  }

  handleHdPathInput(hdpath) {
    this.setState((state, _) => {
      const mnemonic = state.mnemonic
      this.attemptWalletDerivation(
        mnemonic,
        hdpath === '' ? DEFAULT_HD_PATH : hdpath
      )
      return {
        hdpath
      }
    })
  }

  attemptWalletDerivation(mnemonic, hdpath, passphrase) {
    const { setWallet, setAuthMnemonic, setWalletHdPath } = this.props
    const wallet = walletFromMnemonic(mnemonic, hdpath, passphrase)
    setWallet(wallet)
    setAuthMnemonic(Just(mnemonic))
    setWalletHdPath(hdpath)
  }

  render() {
    const { pushRoute, popRoute, wallet } = this.props
    const {
      mnemonic,
      hdpath,
      exampleMnemonic
    } = this.state

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
              placeholder={ `e.g. ${exampleMnemonic}` }
              onChange={ this.handleMnemonicInput }
              value={ mnemonic }
              autocomplete='off'
              autoFocus>
              <InnerLabel>{'Mnemonic'}</InnerLabel>
            </MnemonicInput>


            <InputCaption>
            {`If you'd like to use a custom derivation path, you may enter it below.`}
            </InputCaption>

            <Input
              className='pt-8 text-mono'
              prop-size='md'
              prop-format='innerLabel'
              name='hdpath'
              value={ hdpath }
              autocomplete='off'
              onChange={ this.handleHdPathInput }>
              <InnerLabel>{'HD Path'}</InnerLabel>
            </Input>

            <Button
              className={'mt-10'}
              disabled={ Nothing.hasInstance(wallet) }
              onClick={ () => {
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

export default Mnemonic
