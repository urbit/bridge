import Maybe from 'folktale/maybe'
import React from 'react'
import { Button } from '../components/Base'
import { InnerLabelDropdown } from '../components/Base'
import { Row, Col, H1, P } from '../components/Base'
import * as azimuth from 'azimuth-js'
import Web3 from 'web3'

import { CONTRACT_ADDRESSES } from '../lib/contracts'
import { NETWORK_NAMES, renderNetworkType } from '../lib/network'
import { ROUTE_NAMES } from '../lib/router'

class Network extends React.Component {

  constructor(props) {
    super(props)

    this.handleNetworkChange = this.handleNetworkChange.bind(this);
  }

  handleNetworkChange(network) {
    const { setNetworkType, setNetwork } = this.props

    if (network === NETWORK_NAMES.LOCAL) {
      setNetworkType(network)

      const endpoint = 'ws://localhost:8545'
      const provider = new Web3.providers.WebsocketProvider(endpoint)
      const web3 = new Web3(provider)
      const contracts = azimuth.initContracts(web3, CONTRACT_ADDRESSES.DEV)

      setNetwork(Maybe.Just(web3), Maybe.Just(contracts))
    }

    if (network === NETWORK_NAMES.ROPSTEN) {
      setNetworkType(network)

      const endpoint =
        `https://ropsten.infura.io/v3/${process.env.REACT_APP_INFURA_KEY}`

      const provider = new Web3.providers.HttpProvider(endpoint)
      const web3 = new Web3(provider)
      const contracts = azimuth.initContracts(web3, CONTRACT_ADDRESSES.ROPSTEN)

      setNetwork(Maybe.Just(web3), Maybe.Just(contracts))
    }

    if (network === NETWORK_NAMES.MAINNET) {
      setNetworkType(network)

      const endpoint =
        `https://mainnet.infura.io/v3/${process.env.REACT_APP_INFURA_KEY}`

      const provider = new Web3.providers.HttpProvider(endpoint)
      const web3 = new Web3(provider)
      const contracts = azimuth.initContracts(web3, CONTRACT_ADDRESSES.MAINNET)

      setNetwork(Maybe.Just(web3), Maybe.Just(contracts))
    }

    if (network === NETWORK_NAMES.OFFLINE) {
      setNetworkType(network)

      // NB (jtobin):
      //
      // The 'offline' network type targets the mainnet contracts, but does not
      // actually use a provider to connect.  We use a web3 instance to
      // initalise the contracts, but the network itself is set to Nothing.
      //
      // We may want to offer the ability to select a target network for
      // transactions when offline.

      const web3 = new Web3()

      const target =
          process.env.NODE_ENV === 'development'
        ? CONTRACT_ADDRESSES.DEV
        : CONTRACT_ADDRESSES.MAINNET

      const contracts = azimuth.initContracts(web3, target)

      setNetwork(Maybe.Nothing(), Maybe.Just(contracts))
    }
  }

  getNetworkOptions() {
    return [{
      title: 'Main Network (default)',
      value: NETWORK_NAMES.MAINNET
    }, {
      title: 'Local Node',
      value: NETWORK_NAMES.LOCAL
    }, {
      title: 'Ropsten',
      value: NETWORK_NAMES.ROPSTEN
    }, {
      type: 'divider'
    }, {
      title: 'Offline',
      value: NETWORK_NAMES.OFFLINE
    }, ]
  }

  render() {
    const { networkType, pushRoute } = this.props
    const networkOptions = this.getNetworkOptions()

    return (
        <Row>
          <Col>
            <H1>{ 'Select Network' }</H1>

            <P>
            {
              "Please select the Ethereum node you'd like to send " +
              "transactions to.  For highly valuable keys, please select " +
              "offline mode."
            }
            </P>

            <InnerLabelDropdown
              className={'mt-6'}
              title={'Node:'}
              handleUpdate={this.handleNetworkChange}
              options={networkOptions}
              currentSelectionTitle={renderNetworkType(networkType)}>
            </InnerLabelDropdown>

            <Button
              className={'mt-10'}
              onClick={ () => pushRoute(ROUTE_NAMES.WALLET) }
            >
              { 'Continue  →' }
            </Button>

          </Col>
        </Row>
    )
  }
}

export default Network
