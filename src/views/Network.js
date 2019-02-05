import Maybe from 'folktale/maybe'
import React from 'react'
import { Button } from '../components/Base'
import {
  DropdownItem,
  InnerLabelDropdown,
  DropdownDivider,
  RadioSelection
} from '../components/Base'
import { Row, Col, H1, P, H2 } from '../components/Base'
import * as azimuth from 'azimuth-js'
import Web3 from 'web3'

import { CONTRACT_ADDRESSES } from '../lib/contracts'
import { NETWORK_NAMES, renderNetworkType } from '../lib/network'
import { ROUTE_NAMES } from '../lib/router'

class Network extends React.Component {

  constructor(props) {
    super(props)

    this.state = {
      network: false
    };

    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleNetworkChange = this.handleNetworkChange.bind(this);
  }

  toggle() {
    this.setState((state, _) => ({
      dropdownOpen: !state.dropdownOpen
    }))
  }

  componentDidMount() {
    const { networkType } = this.props
    this.handleNetworkChange(networkType)
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


  handleSubmit() {
    const { props } = this
    props.pushRoute(ROUTE_NAMES.WALLET)
  }

  render() {
    const { props, state } = this

    return (
      <Row>
        <Col className={'measure-lg'}>
          <H1>{ 'Network' }</H1>

          <P>
          {
            `Please select the Ethereum Node you would like to send transactions
            to. The default Main Network is adequate for most uses.`
          }
          </P>

          <H2>Select a Node</H2>

          <RadioSelection
            onClick={() => this.handleNetworkChange(NETWORK_NAMES.MAINNET)}
            autoFocus
            isSelected={props.networkType === NETWORK_NAMES.MAINNET}>
            <h3>Main Network</h3>
            <p>Connects to Infura and is adequate for most uses.</p>
          </RadioSelection>

          <RadioSelection
            className={'mt-4'}
            onClick={() => this.handleNetworkChange(NETWORK_NAMES.LOCAL)}
            isSelected={props.networkType === NETWORK_NAMES.LOCAL}>
            <h3>Local Node</h3>
            <p>If you are running your own node on your local machine.</p>
          </RadioSelection>

          <RadioSelection
            className={'mt-4'}
            onClick={() => this.handleNetworkChange(NETWORK_NAMES.ROPSTEN)}
            isSelected={props.networkType === NETWORK_NAMES.ROPSTEN}>
            <h3>Ropsten</h3>
            <p>If you would like to use he Ropsten testnet.</p>
          </RadioSelection>

          <RadioSelection
            className={'mt-4'}
            onClick={() => this.handleNetworkChange(NETWORK_NAMES.OFFLINE)}
            isSelected={props.networkType === NETWORK_NAMES.OFFLINE}>
            <h3>Offline</h3>
            <p>Use this option to generate offline or sensitive transactions.</p>
          </RadioSelection>


          <Row className={'mt-8'}>
            <Button
              prop-size={'lg wide'}
              onClick={ this.handleSubmit }>
              { 'Connect →' }
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

export default Network
