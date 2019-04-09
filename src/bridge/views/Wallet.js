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
  }

  componentDidMount() {
    const { setWallet } = this.props
    setWallet(Maybe.Nothing())
  }

  getWalletOptions() {
    return [{
      title: 'Urbit Master Ticket',
      value: WALLET_NAMES.TICKET
    }, {
      title: 'Urbit Master Ticket (Shards)',
      value: WALLET_NAMES.SHARDS
    }, {
      type: 'divider'
    }, {
      title: 'Ledger',
      value: WALLET_NAMES.LEDGER
    }, {
      title: 'Trezor',
      value: WALLET_NAMES.TREZOR
    }, {
      type: 'divider'
    }, {
      title: 'BIP39 Mnemonic',
      value: WALLET_NAMES.MNEMONIC
    }, {
      title: 'Ethereum Private Key',
      value: WALLET_NAMES.PRIVATE_KEY
    }, {
      title: 'Ethereum Keystore File',
      value: WALLET_NAMES.KEYSTORE
    }]
  }

  render() {
    const { props, state } = this
    const walletOptions = this.getWalletOptions()

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
            title={'Wallet Type:'}
            options={walletOptions}
            handleUpdate={props.setWalletType}
            currentSelectionTitle={renderWalletType(props.walletType)}>
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
