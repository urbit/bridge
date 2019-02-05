import Maybe from 'folktale/maybe'
import React from 'react'
import { Button, H1, P, H2, RadioSelection } from '../components/Base'
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
    this.handleSubmit = this.handleSubmit.bind(this)

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

  handleSubmit() {
    const { props } = this
    props.pushRoute(
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
      : ROUTE_NAMES.DEFAULT
    )
  }

  render() {
    const { props, state } = this

    return (
      <Row>
        <Col className={'measure-lg'}>
          <H1>{ 'Unlock a Wallet' }</H1>

            <P>
            {
              `To manage your assets, you need to unlock a wallet.
              Please select how you would like to access your wallet.`
            }

            </P>

            <H2>Select a Wallet Type</H2>

            <RadioSelection
              onClick={() => props.setWalletType(WALLET_NAMES.TICKET)}
              autoFocus
              isSelected={props.walletType === WALLET_NAMES.TICKET}>
              <h3>Azimuth Master Ticket</h3>
              <p>A master key used manage every aspect of your address.</p>
            </RadioSelection>

            <RadioSelection
              className={'mt-4'}
              onClick={() => props.setWalletType(WALLET_NAMES.SHARDS)}
              isSelected={props.walletType === WALLET_NAMES.SHARDS}>
              <h3>Azimuth Master Ticket (Shards)</h3>
              <p>A three-part sharded Master Ticket.</p>
            </RadioSelection>

            <RadioSelection
              className={'mt-4'}
              onClick={() => props.setWalletType(WALLET_NAMES.LEDGER)}
              isSelected={props.walletType === WALLET_NAMES.LEDGER}>
              <h3>Ledger</h3>
              <p>A hardware wallet made by Ledger SAS</p>
            </RadioSelection>

            <RadioSelection
              className={'mt-4'}
              onClick={() => props.setWalletType(WALLET_NAMES.TREZOR)}
              disabled={
                    props.web3.matchWith({
                      Nothing: () => true,
                      Just: () => false
                    })
                  }
              isSelected={props.walletType === WALLET_NAMES.TREZOR}>
              <h3>Trezor</h3>
              <p>A hardware wallet made by SatoshiLabs S.R.O.</p>
            </RadioSelection>

            <RadioSelection
              className={'mt-4'}
              onClick={() => props.setWalletType(WALLET_NAMES.MNEMONIC)}
              isSelected={props.walletType === WALLET_NAMES.MNEMONIC}>
              <h3>Mnemonic</h3>
              <p>A BIP39 mnemonic, including Urbit HD wallet proxies</p>
            </RadioSelection>

            <RadioSelection
              className={'mt-4'}
              onClick={() => props.setWalletType(WALLET_NAMES.PRIVATE_KEY)}
              isSelected={props.walletType === WALLET_NAMES.PRIVATE_KEY}>
              <h3>Ethereum Private Key</h3>
              <p>A raw ethereum 256bit private key</p>
            </RadioSelection>

            <RadioSelection
              className={'mt-4'}
              onClick={() => props.setWalletType(WALLET_NAMES.KEYSTORE)}
              isSelected={props.walletType === WALLET_NAMES.KEYSTORE}>
              <h3>Ethereum Keystore File</h3>
              <p>A standardized format for storing wallet information</p>
            </RadioSelection>

          {

          // <InnerLabelDropdown
          //   className={'mt-8'}
          //   handleToggle={this.toggle}
          //   handleClose={this.close}
          //   isOpen={state.dropdownOpen}
          //   title={'Wallet Type:'}
          //   currentSelectionTitle={renderWalletType(props.walletType)}>
          //
          //   <DropdownItem
          //     onClick={ () => this.selectClose(() => props.setWalletType(WALLET_NAMES.TICKET)) }>
          //     { 'Urbit Master Ticket' }
          //   </DropdownItem>
          //
          //   <DropdownItem
          //     onClick={ () => this.selectClose(() => props.setWalletType(WALLET_NAMES.SHARDS)) }>
          //     { 'Urbit Master Ticket (Shards)' }
          //   </DropdownItem>
          //
          //   <DropdownDivider />
          //
          //   <DropdownItem
          //     onClick={ () => this.selectClose(() => props.setWalletType(WALLET_NAMES.LEDGER)) }
          //   >
          //     { 'Ledger' }
          //   </DropdownItem>
          //
          //   <DropdownItem
          //     onClick={ () => this.selectClose(() => props.setWalletType(WALLET_NAMES.TREZOR)) }
          //     disabled={
          //       props.web3.matchWith({
          //         Nothing: () => true,
          //         Just: () => false
          //       })
          //     }>
          //     { 'Trezor' }
          //   </DropdownItem>
          //
          //   <DropdownDivider />
          //
          //   <DropdownItem
          //     onClick={ () => this.selectClose(() => props.setWalletType(WALLET_NAMES.MNEMONIC)) }
          //   >
          //     { 'BIP39 Mnemonic' }
          //   </DropdownItem>
          //
          //   <DropdownItem
          //     onClick={ () => this.selectClose(() => props.setWalletType(WALLET_NAMES.PRIVATE_KEY)) }
          //   >
          //     { 'Ethereum Private Key' }
          //   </DropdownItem>
          //
          //   <DropdownItem
          //     onClick={ () => this.selectClose(() => props.setWalletType(WALLET_NAMES.KEYSTORE)) }
          //   >
          //     { 'Ethereum Keystore File' }
          //   </DropdownItem>

          }

          <Row className={'mt-8'}>
            <Button
              prop-size={'lg wide'}
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
              }>
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

export default Wallet
