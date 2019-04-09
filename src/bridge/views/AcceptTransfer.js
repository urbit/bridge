import { Just } from 'folktale/maybe'
import React from 'react'
import { Row, Col, H1, P } from '../components/Base'
import { InnerLabel, AddressInput, ShowBlockie, Anchor } from '../components/Base'
import * as azimuth from 'azimuth-js'
import * as ob from 'urbit-ob'

import StatelessTransaction from '../components/StatelessTransaction'
import { BRIDGE_ERROR } from '../lib/error'
import { NETWORK_NAMES } from '../lib/network'
import { isValidAddress, addressFromSecp256k1Public } from '../lib/wallet'

class AcceptTransfer extends React.Component {
  constructor(props) {
    super(props)

    const receivingAddress = props.wallet.matchWith({
      Just: (wal) => addressFromSecp256k1Public(wal.value.publicKey),
      Nothing: () => {
        throw BRIDGE_ERROR.MISSING_WALLET
      }
    })

    const incomingPoint = props.pointCursor.matchWith({
      Just: (shp) => shp.value,
      Nothing: () => {
        throw BRIDGE_ERROR.MISSING_POINT
      }
    })

    this.state = {
      receivingAddress: receivingAddress,
      incomingPoint: incomingPoint,
    }

    this.handleAddressInput = this.handleAddressInput.bind(this)
    this.createUnsignedTxn = this.createUnsignedTxn.bind(this)
    this.statelessRef = React.createRef();
  }

  handleAddressInput(proxyAddress) {
    this.setState({ proxyAddress })
    this.statelessRef.current.clearTxn()
  }

  createUnsignedTxn() {
    const { state, props } = this

    const validContracts = props.contracts.matchWith({
      Just: (cs) => cs.value,
      Nothing: () => {
        throw BRIDGE_ERROR.MISSING_CONTRACTS
      }
    })

    const validPoint = props.pointCursor.matchWith({
      Just: (shp) => shp.value,
      Nothing: () => {
        throw BRIDGE_ERROR.MISSING_POINT
      }
    })

    const owner = props.pointCache[validPoint].owner

    return Just(azimuth.ecliptic.transferFrom(
      validContracts,
      owner,
      state.receivingAddress.toLowerCase(),
      validPoint
    ))
  }

  render() {
    const { state, props } = this
    const validAddress = isValidAddress(state.receivingAddress)
    const canGenerate = validAddress === true

    const esvisible =
        props.networkType === NETWORK_NAMES.ROPSTEN ||
        props.networkType === NETWORK_NAMES.MAINNET

    const esdomain =
        props.networkType === NETWORK_NAMES.ROPSTEN
      ? "ropsten.etherscan.io"
      : "etherscan.io"

    return (
      <Row>
        <Col>
          <H1>
            { 'Accept Transfer of '} <code>{ ` ${ob.patp(state.incomingPoint)} ` }</code>
          </H1>

          <P>
          {
            "By default, the recipient is the address you're logged in " +
            "as.  But you can transfer to any address you like."
          }
          </P>

          <AddressInput
            className='mono mt-8'
            prop-size='lg'
            prop-format='innerLabel'
            value={ state.receivingAddress }
            onChange={ v => this.handleAddressInput(v) }>
            <InnerLabel>{ 'Receiving Address' }</InnerLabel>
            <ShowBlockie className={'mt-1'} address={state.receivingAddress} />
          </AddressInput>

          <Anchor
            className={'mt-1 sm'}
            prop-size='sm'
            prop-disabled={!isValidAddress(state.receivingAddress) || !esvisible}
            target={'_blank'}
            href={`https://${esdomain}/address/${state.receivingAddress}`}>
              {'View on Etherscan ↗'}
          </Anchor>

          <StatelessTransaction
            // Upper scope
            web3={props.web3}
            contracts={props.contracts}
            wallet={props.wallet}
            walletType={props.walletType}
            walletHdPath={props.walletHdPath}
            networkType={props.networkType}
            setTxnHashCursor={props.setTxnHashCursor}
            popRoute={props.popRoute}
            pushRoute={props.pushRoute}
            // Other
            canGenerate={ canGenerate }
            createUnsignedTxn={this.createUnsignedTxn}
            ref={ this.statelessRef } />
        </Col>
      </Row>
    )
  }
}

export default AcceptTransfer
