import Maybe from 'folktale/maybe'
import React from 'react'
import { Button } from '../components/Base'
import {
  DropdownItem,
  InnerLabelDropdown,
  DropdownDivider,
} from '../components/Base'
import { Row, Col, H1, P } from '../components/Base'
import * as azimuth from 'azimuth-js'
import Web3 from 'web3'

import { CONTRACT_ADDRESSES } from '../lib/contracts'
import { NETWORK_NAMES, renderNetworkType } from '../lib/network'
import { ROUTE_NAMES } from '../lib/router'

class Network extends React.Component {

  constructor(props) {
    super(props)

    this.state = {
      dropdownOpen: false
    };

    this.toggle = this.toggle.bind(this);
    this.close = this.close.bind(this);
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

      const endpoint = 'wss://localhost:8545'
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

  selectClose(f) {
    f()
    this.setState({ dropdownOpen: false })
  }


  close () {
    this.setState({ dropdownOpen: false })
  }

  render() {
    const { dropdownOpen } = this.state
    const { networkType, pushRoute } = this.props

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
            handleToggle={this.toggle}
            handleClose={this.close}
            isOpen={dropdownOpen}
            title={'Node:'}
            currentSelectionTitle={renderNetworkType(networkType)}
          >

              <DropdownItem
                isSelected={ false }
                onClick={
                  () => this.selectClose(() => this.handleNetworkChange(NETWORK_NAMES.MAINNET))
                }
              >
                { 'Main Network (default)' }
              </DropdownItem>

              <DropdownItem
                isSelected={false}
                onClick={
                  () => this.selectClose(() => this.handleNetworkChange(NETWORK_NAMES.LOCAL))
                }
              >
                { //'Ganache Node @ Port 8545 (Default)'
                }
                {'Local Node'}
              </DropdownItem>

              <DropdownItem
                // disabled={ true }
                isSelected={ false }
                onClick={
                  () => this.selectClose(() => this.handleNetworkChange(NETWORK_NAMES.ROPSTEN))
                }
              >
                { 'Ropsten' }
              </DropdownItem>

              <DropdownDivider />

              <DropdownItem
                // disabled={ true }
                isSelected={ false }
                onClick={
                  () => this.selectClose(() => this.handleNetworkChange(NETWORK_NAMES.OFFLINE))
                }
              >
                { 'Offline' }
              </DropdownItem>

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
