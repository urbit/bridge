import Maybe from 'folktale/maybe'
import React from 'react'
import { Button, H1, P } from '../components/Base'
import {
  InnerLabelDropdown,
  DropdownItem,
  DropdownDivider
} from '../components/Base'
import { Row, Col } from '../components/Base'

import { ROUTE_NAMES } from '../lib/router'
import { WALLET_NAMES, renderWalletType } from '../lib/wallet'

class Wallet extends React.Component {

  constructor(props) {
    super(props)

    this.state = {
      dropdownOpen: false
    }

    this.toggle = this.toggle.bind(this)
    this.close = this.close.bind(this)

  }

  componentDidMount() {
    const { setWallet } = this.props
    setWallet(Maybe.Nothing())
  }

  toggle() {
    this.setState((state, _) => ({
      dropdownOpen: !state.dropdownOpen
    }))
  }

  selectClose(f) {
    f()
    this.setState({ dropdownOpen: false })
  }

  close () {
    this.setState({ dropdownOpen: false })
  }

  render() {
    const { props, state } = this

    return (
      <Row>
        <Col>
          <H1>{ 'Unlock a Wallet' }</H1>

            <P>
            {
              `To manage your assets, you need to unlock a wallet.
              Please select how you would like to access your wallet.`
            }

            </P>

          <InnerLabelDropdown
            className={'mb-10 mt-6'}
            handleToggle={this.toggle}
            handleClose={this.close}
            isOpen={state.dropdownOpen}
            title={'Wallet Type:'}
            currentSelectionTitle={renderWalletType(props.walletType)}>

            <DropdownItem
              onClick={ () => this.selectClose(() => props.setWalletType(WALLET_NAMES.TICKET)) }
            >
              { 'Urbit Master Ticket' }
            </DropdownItem>

            <DropdownItem
              onClick={ () => this.selectClose(() => props.setWalletType(WALLET_NAMES.SHARDS)) }
            >
              { 'Urbit Master Ticket (Shards)' }
            </DropdownItem>

            <DropdownDivider />

            <DropdownItem
              onClick={ () => this.selectClose(() => props.setWalletType(WALLET_NAMES.MNEMONIC)) }
            >
              { 'BIP39 Mnemonic' }
            </DropdownItem>

            <DropdownDivider />

            <DropdownItem
              onClick={ () => this.selectClose(() => props.setWalletType(WALLET_NAMES.LEDGER)) }
            >
              { 'Ledger' }
            </DropdownItem>

            <DropdownItem
              onClick={ () => this.selectClose(() => props.setWalletType(WALLET_NAMES.TREZOR)) }
              disabled={
                props.web3.matchWith({
                  Nothing: () => true,
                  Just: () => false
                })
              }
            >
              { 'Trezor' }
            </DropdownItem>

            <DropdownDivider />

            <DropdownItem
              onClick={ () => this.selectClose(() => props.setWalletType(WALLET_NAMES.PRIVATE_KEY)) }
            >
              { 'Ethereum Private Key' }
            </DropdownItem>

            <DropdownItem
              onClick={ () => this.selectClose(() => props.setWalletType(WALLET_NAMES.KEYSTORE)) }
            >
              { 'Ethereum Keystore File' }
            </DropdownItem>



          </InnerLabelDropdown>

          <Button
            className={'mt-10'}
            onClick={
              () => props.pushRoute(
                  props.walletType === WALLET_NAMES.MNEMONIC
                ? ROUTE_NAMES.MNEMONIC
                : props.walletType === WALLET_NAMES.TICKET
                ? ROUTE_NAMES.TICKET
                : props.walletType === WALLET_NAMES.SHARDS
                ? ROUTE_NAMES.SHARDS
                : props.walletType === WALLET_NAMES.LEDGER
                ? ROUTE_NAMES.LEDGER
                : props.walletType === WALLET_NAMES.TREZOR
                ? ROUTE_NAMES.TREZOR
                : props.walletType === WALLET_NAMES.PRIVATE_KEY
                ? ROUTE_NAMES.PRIVATE_KEY
                : props.walletType === WALLET_NAMES.KEYSTORE
                ? ROUTE_NAMES.KEYSTORE
                : ROUTE_NAMES.DEFAULT
              )
            }
          >
            { 'Continue  →' }
          </Button>
        </Col>
      </Row>
    )
  }

}

export default Wallet
