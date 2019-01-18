import React from 'react'
import Maybe from 'folktale/maybe'
import * as azimuth from 'azimuth-js'
import * as ob from 'urbit-ob'

import { Button, } from '../components/Base'
import { Row, Col, H1, H3, P, Anchor, Warning } from '../components/Base'
import {
  InnerLabel,
  GalaxyInput,
  AddressInput,
  ValidatedSigil,
  ShowBlockie
  } from '../components/Base'
import StatelessTransaction from '../components/StatelessTransaction'

import { BRIDGE_ERROR } from '../lib/error'

import { NETWORK_NAMES } from '../lib/network'

import {
  sendSignedTransaction,
  canDecodePatp,
  fromWei,
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
      isAvailable: Maybe.Nothing(),
      userApproval: false,
      nonce: '',
      gasPrice: '5',
      chainId: '',
      txInfo: '',
      gasLimit: '600000',
      txn: Maybe.Nothing(),
      stx: Maybe.Nothing(),
      txError: Maybe.Nothing(),
    }

    this.handleGalaxyInput = this.handleGalaxyInput.bind(this)
    this.handleAddressInput = this.handleAddressInput.bind(this)
    this.handleConfirmAvailability = this.handleConfirmAvailability.bind(this)
    // Transaction
    this.handleCreateUnsignedTxn = this.handleCreateUnsignedTxn.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
    this.handleSetUserApproval = this.handleSetUserApproval.bind(this)
    this.handleSetTxn = this.handleSetTxn.bind(this)
    this.handleSetStx = this.handleSetStx.bind(this)
    this.handleSetNonce = this.handleSetNonce.bind(this)
    this.handleSetChainId = this.handleSetChainId.bind(this)
    this.handleSetGasPrice = this.handleSetGasPrice.bind(this)
    this.handleSetGasLimit = this.handleSetGasLimit.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
  }

  componentDidMount() {
    const { props } = this

    const addr = props.wallet.matchWith({
      Just: wal => addressFromSecp256k1Public(wal.value.publicKey),
      Nothing: () => {
        throw BRIDGE_ERROR.MISSING_WALLET
      }
    })

    props.web3.matchWith({
      Nothing: () => {},
      Just: (w3) => {
        const validWeb3 = w3.value

        const getTxMetadata = [
          validWeb3.eth.getTransactionCount(addr),
          validWeb3.eth.net.getId(),
          validWeb3.eth.getGasPrice()
        ];

        Promise.all(getTxMetadata).then(r => {
          const txMetadata = {
            nonce: r[0],
            chainId: r[1],
            gasPrice: fromWei(r[2], 'gwei'),
          };

          this.setState({...txMetadata})

        })
      }
    });

  }



  handleAddressInput(receivingAddress) {
    this.setState({ receivingAddress })
    this.handleClearTxn()
  }



  handleGalaxyInput(galaxyName) {
    if (galaxyName.length < 15) {
      this.setState({
        galaxyName,
        isAvailable: Maybe.Nothing()
      })
      this.handleClearTxn()
    }
  }



  handleConfirmAvailability() {
    this.confirmAvailability().then(r => {
      this.setState({
        isAvailable: r,
      })
    })
  }



  handleCreateUnsignedTxn() {
    const txn = this.createUnsignedTxn()
    this.setState({ txn })
  }


  handleSetUserApproval(){
    const {state} = this
    this.setState({ userApproval: !state.userApproval })
  }



  handleSetTxn(txn){
    this.setState({ txn })
  }



  handleSetStx(stx){
    this.setState({
      stx,
      userApproval: false,
    })
  }



  handleSetNonce(nonce){
    this.setState({ nonce })
    this.handleClearStx()
  }



  handleSetChainId(chainId){
    this.setState({ chainId })
    this.handleClearStx()
  }



  handleSetGasPrice(gasPrice){
    this.setState({ gasPrice })
    this.handleClearStx()
  }



  handleSetGasLimit(gasLimit){
    this.setState({ gasLimit })
    this.handleClearStx()
  }



  handleClearStx() {
    this.setState({
      userApproval: false,
      stx: Maybe.Nothing(),
    })
  }



  handleClearTxn() {
    this.setState({
      userApproval: false,
      txn: Maybe.Nothing(),
      stx: Maybe.Nothing(),
    })
  }



  handleClearTransaction() {
    this.setState({
      userApproval: false,
      txn: Maybe.Nothing(),
      stx: Maybe.Nothing(),
    })
  }



  handleSubmit(){
    const { props, state } = this
    sendSignedTransaction(props.web3.value, state.stx)
      .then(sent => {
        props.setTxnCursor(sent)
        props.popRoute()
        props.pushRoute(ROUTE_NAMES.SENT_TRANSACTION)
      })
      .catch(err => {
        // Note that value.value is due to wrapped Maybe.Just + Result.Error
        this.setState({ txError: Maybe.Just(err.value.value) })
      })
  }



  buttonTriState() {
    const a = this.state.isAvailable
    if (Maybe.Nothing.hasInstance(a)) return 'blue'
    if (a.value === false) return 'yellow'
    if (a.value === true) return 'green'
  }



  buttonTriStateText() {
    const a = this.state.isAvailable
    if (Maybe.Nothing.hasInstance(a)) return 'Confirm Availablility'
    if (a.value === false) return 'Point is Not Available'
    if (a.value === true) return 'Available'
  }




  createUnsignedTxn() {
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

    return Maybe.Just(txn)
  }



  async confirmAvailability() {
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

    const owner = await azimuth.azimuth.getOwner(
      validContracts,
      galaxyDec
    )

    if (eqAddr(owner, ETH_ZERO_ADDR)) return Maybe.Just(true)

    return Maybe.Just(false)

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

    const canGenerate = props.web3.matchWith({
      Nothing: () =>
        validAddress === true &&
        validGalaxy === true,
      Just: _ =>
        validAddress === true &&
        validGalaxy === true &&
        state.isAvailable.value === true
    })

    const canSign = Maybe.Just.hasInstance(state.txn)
    const canApprove = Maybe.Just.hasInstance(state.stx)
    const canSend =
      Maybe.Just.hasInstance(state.stx) &&
      state.userApproval === true

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
            onChange={v => this.handleGalaxyInput(v)}>
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
            prop-color={this.buttonTriState()}
            disabled={!validGalaxy}
            onClick={() => this.handleConfirmAvailability()}>
            {this.buttonTriStateText()}
          </Button>

          <StatelessTransaction
            // Upper scope
            web3={props.web3}
            contracts={props.contracts}
            wallet={props.wallet}
            walletType={props.walletType}
            walletHdPath={props.walletHdPath}
            // Tx
            txn={state.txn}
            stx={state.stx}
            // Tx details
            nonce={state.nonce}
            gasPrice={state.gasPrice}
            chainId={state.chainId}
            gasLimit={state.gasLimit}
            // Checks
            userApproval={state.userApproval}
            canGenerate={ canGenerate }
            canSign={ canSign }
            canApprove={ canApprove }
            canSend={ canSend }
            // Methods
            createUnsignedTxn={this.handleCreateUnsignedTxn}
            setUserApproval={this.handleSetUserApproval}
            setTxn={this.handleSetTxn}
            setStx={this.handleSetStx}
            setNonce={this.handleSetNonce}
            setChainId={this.handleSetChainId}
            setGasPrice={this.handleSetGasPrice}
            setGasLimit={this.handleSetGasLimit}
            handleSubmit={this.handleSubmit} />

          {
            Maybe.Nothing.hasInstance(state.txError)
              ? ''
              : <Warning className={'mt-8'}>
                  <H3 style={{marginTop: 0, paddingTop: 0}}>
                    {
                      'There was an error sending your transaction.'
                    }
                  </H3>
                  { state.txError.value }
              </Warning>
          }
        </Col>
      </Row>
    )
  }
}

export default CreateGalaxy
