import React from 'react'
import Maybe from 'folktale/maybe'
import * as azimuth from 'azimuth-js'
import * as ob from 'urbit-ob'

import { Button, } from '../components/Base'
import { Row, Col, H1, P, Anchor } from '../components/Base'
import { InnerLabel, GalaxyInput, AddressInput, ValidatedSigil, ShowBlockie } from '../components/Base'
import StatelessTransaction from '../components/StatelessTransaction'

import { BRIDGE_ERROR } from '../lib/error'

import { NETWORK_NAMES } from '../lib/network'

import {
  sendSignedTransaction,
  getTxnInfo,
  canDecodePatp
} from '../lib/txn'

import { ROUTE_NAMES } from '../lib/router'

import {
  addressFromSecp256k1Public,
  ETH_ZERO_ADDR,
  isValidAddress,
  eqAddr
} from '../lib/wallet'

import {
  isValidGalaxy
} from '../lib/lib'


const buttonTriState = status => {
  if (status === null) return 'blue'
  if (status === false) return 'yellow'
  if (status === true) return 'green'
}

const buttonTriStateText = status => {
  if (status === null) return 'Confirm Galaxy Availablility'
  if (status === false) return 'Galaxy is Not Available'
  if (status === true) return 'Galaxy is Available'
}



class CreateGalaxy extends React.Component {
  constructor(props) {
    super(props)

    const galaxyOwner = props.wallet.matchWith({
      Just: (wal) => addressFromSecp256k1Public(wal.value.publicKey),
      Nothing: () => {
        throw BRIDGE_ERROR.MISSING_WALLET
      }
    })

    this.state = {
      galaxyOwner: galaxyOwner,
      galaxyName: '',
      isAvailable: null,
      txApproval: false,
      nonce: '',
      gasPrice: '5',
      showGasDetails: false,
      chainId: '',
      txInfo: '',
      gasLimit: '600000',
      txn: Maybe.Nothing(),
      stx: Maybe.Nothing(),
    }

    this.handleAddressInput = this.handleAddressInput.bind(this)
    this.handleGalaxyNameInput = this.handleGalaxyNameInput.bind(this)
    this.confirmAvailability = this.confirmAvailability.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
    this.toggleGasDetails = this.toggleGasDetails.bind(this)
  }

  toggleGasDetails() {
    this.setState({
      showGasDetails: !this.state.showGasDetails
    })
  }

  componentDidMount() {
    const { props } = this
    const addr = props.wallet.matchWith({
      Just: wal => addressFromSecp256k1Public(wal.value.publicKey),
      Nothing: () => {
        throw BRIDGE_ERROR.MISSING_WALLET
      }
    })

    // getTxnInfo(props.web3.value, addr).then(txInfo => this.setState(txInfo))
    props.web3.map(w3 => getTxnInfo(w3, addr)
      .then(txInfo => this.setState(txInfo))
    )
  }


  handleGalaxyNameInput = (galaxyName) => {
    this.setState({ galaxyName, isAvailable: null })
    this.clearTransaction()
  }

  handleAddressInput = (galaxyOwner) => {
    this.setState({ galaxyOwner })
    this.clearTransaction()
  }

  createUnsignedTxn = () => {
    const { state, props } = this
    if (isValidAddress(state.galaxyOwner) === false) return Maybe.Nothing()
    if (state.isAvailable === false) return Maybe.Nothing()
    if (canDecodePatp(state.galaxyName) === false) return Maybe.Nothing()
    if (isValidGalaxy(state.galaxyName) === false) return Maybe.Nothing()

    const validContracts = props.contracts.matchWith({
      Just: (cs) => cs.value,
      Nothing: () => {
        throw BRIDGE_ERROR.MISSING_CONTRACTS
      }
    })

    const galaxyDec = parseInt(ob.patp2dec(state.galaxyName), 10)

    const txn = azimuth.ecliptic.createGalaxy(
      validContracts,
      galaxyDec,
      state.galaxyOwner
    )

    this.setState({ txn: Maybe.Just(txn) })
  }


  handleSubmit = () => {
    const { props, state } = this
    sendSignedTransaction(props.web3.value, state.stx)
      .then(sent => {
        props.setTxnHashCursor(sent)
        props.popRoute()
        props.pushRoute(ROUTE_NAMES.SENT_TRANSACTION)
      })
  }

  confirmAvailability = async () => {
    const { state, props } = this

    if (canDecodePatp(state.galaxyName) === false) {
      this.setState({ isAvailable: false })
      return
    }

    const validContracts = props.contracts.matchWith({
      Just: (cs) => cs.value,
      Nothing: () => {
        throw BRIDGE_ERROR.MISSING_CONTRACTS
      }
    })

    const galaxyDec = ob.patp2dec(state.galaxyName)

    const currentOwner = await azimuth.azimuth.getOwner(
      validContracts,
      galaxyDec
    )

    const available = eqAddr(currentOwner, ETH_ZERO_ADDR)

    this.setState({ isAvailable: available })
  }


  clearTransaction = () => {
    this.setState({
      txApproval: false,
      txn: Maybe.Nothing(),
      stx: Maybe.Nothing(),
    })
  }

  render() {
    const { props, state } = this

    const validAddress = isValidAddress(state.galaxyOwner)
    const validGalaxy = isValidGalaxy(state.galaxyName)

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
          <H1> { 'Create a Galaxy' } </H1>

          <P>
          {
            'Enter the galaxy to create and the address that will own ' +
            'it (defaulting to this account, if not provided).'
          }
          </P>

          <GalaxyInput
            className='mono'
            prop-size='lg'
            prop-format='innerLabel'
            autoFocus
            placeholder='e.g. ~zod'
            value={state.galaxyName}
            onChange={v => this.handleGalaxyNameInput(v)}>
            <InnerLabel>{ 'Galaxy Name' }</InnerLabel>
            <ValidatedSigil
              className='tr-0 mt-05 mr-0 abs'
              patp={state.galaxyName}
              size={76}
              margin={8} />
          </GalaxyInput>

          <AddressInput
            className='mono mt-8'
            prop-size='lg'
            prop-format='innerLabel'
            value={ state.galaxyOwner }
            onChange={ v => this.handleAddressInput(v) }>
            <InnerLabel>
              { 'Address that will own this galaxy' }
            </InnerLabel>
            <ShowBlockie
              className={'mt-1'}
              address={state.galaxyOwner} />
          </AddressInput>

          <Anchor
            className={'mt-1'}
            prop-size={'sm'}
            prop-disabled={!validAddress || !esvisible}
            target={'_blank'}
            href={`https://${esdomain}/address/${state.galaxyOwner}`}>
              {'View on Etherscan ↗'}
          </Anchor>

          <Button
            prop-size='lg wide'
            className='mt-8'
            prop-color={buttonTriState(state.isAvailable)}
            disabled={!validGalaxy}
            onClick={() => this.confirmAvailability()}>
            {buttonTriStateText(state.isAvailable)}
          </Button>

          <StatelessTransaction
            address={state.galaxyOwner}
            shipName={state.galaxyName}
            isAvailable={state.isAvailable}
            web3={props.web3}
            contracts={props.contracts}
            wallet={props.wallet}
            walletType={props.walletType}
            walletHdPath={props.walletHdPath}
            networkType={props.networkType}
            // Tx
            txApproval={state.txApproval}
            txn={state.txn}
            stx={state.stx}
            nonce={state.nonce}
            gasPrice={state.gasPrice}
            showGasDetails={state.showGasDetails}
            toggleGasDetails={this.toggleGasDetails}
            chainId={state.chainId}
            gasLimit={state.gasLimit}
            canGenerate={
              validAddress === true &&
              validGalaxy === true &&
              state.isAvailable === true
            }
            canSign={Maybe.Just.hasInstance(state.txn)}
            canSend={Maybe.Just.hasInstance(state.stx)}
            // Methods
            createUnsignedTxn={() => this.createUnsignedTxn()}
            clearTransaction={() => this.clearTransaction()}
            setApproval={() => this.setState({txApproval: !state.txApproval})}
            setTxn={txn => this.setState({txn})}
            setStx={stx => this.setState({stx})}
            setNonce={nonce => this.setState({nonce})}
            setChainId={chainId => this.setState({chainId})}
            setGasPrice={gasPrice => this.setState({gasPrice})}
            setGasLimit={gasLimit => this.setState({gasLimit})}
            handleSubmit={this.handleSubmit} />

        </Col>
      </Row>
    )
  }
}




export default CreateGalaxy
