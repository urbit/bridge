import { Just, Nothing } from 'folktale/maybe'
import React from 'react'
import { Row, Col, H1, H3, P, Warning } from '../components/Base'
import { InnerLabel, AddressInput, ShowBlockie, Anchor } from '../components/Base'
import * as azimuth from 'azimuth-js'
import * as ob from 'urbit-ob'

import StatelessTransaction from '../components/StatelessTransaction'
import { BRIDGE_ERROR } from '../lib/error'
import { NETWORK_NAMES } from '../lib/network'
import { ROUTE_NAMES } from '../lib/router'
import { sendSignedTransaction, fromWei } from '../lib/txn'
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
      txn: Nothing(),
      txError: Nothing(),
      incomingPoint: incomingPoint,
      userApproval: false,
      nonce: '',
      gasPrice: '5',
      showGasDetails: false,
      chainId: '',
      gasLimit: '600000',
      stx: Nothing(),
    }

    this.handleAddressInput = this.handleAddressInput.bind(this)
    this.handleCreateUnsignedTxn = this.handleCreateUnsignedTxn.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
    this.handleSetUserApproval = this.handleSetUserApproval.bind(this)
    this.handleSetTxn = this.handleSetTxn.bind(this)
    this.handleSetStx = this.handleSetStx.bind(this)
    this.handleSetNonce = this.handleSetNonce.bind(this)
    this.handleSetChainId = this.handleSetChainId.bind(this)
    this.handleSetGasPrice = this.handleSetGasPrice.bind(this)
    this.handleSetGasLimit = this.handleSetGasLimit.bind(this)
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

  handleAddressInput(proxyAddress) {
    this.setState({ proxyAddress })
    this.handleClearTxn()
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
      stx: Nothing(),
    })
  }

  handleClearTxn() {
    this.setState({
      userApproval: false,
      txn: Nothing(),
      stx: Nothing(),
    })
  }

  handleSubmit() {
    const { props, state } = this
    sendSignedTransaction(props.web3.value, state.stx)
      .then(sent => {
        props.setTxnHashCursor(sent)
        props.popRoute()
        props.pushRoute(ROUTE_NAMES.SENT_TRANSACTION)
      })
      .catch(err => {
        this.setState({ txError: err.map(val => val.merge()) })
      })
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
      state.receivingAddress,
      validPoint
    ))
  }

  render() {

    const { state, props } = this
    const validAddress = isValidAddress(state.receivingAddress)
    const canGenerate = validAddress === true
    const canSign = Just.hasInstance(state.txn)
    const canApprove = Just.hasInstance(state.stx)
    const canSend =
      Just.hasInstance(state.stx)
      && state.userApproval === true

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
            // Tx
            txn={state.txn}
            stx={state.stx}
            // Tx details
            nonce={state.nonce}
            gasPrice={state.gasPrice}
            chainId={state.chainId}
            gasLimit={state.gasLimit}
            showGasDetails={state.showGasDetails}
            toggleGasDetails={this.toggleGasDetails}
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
            Nothing.hasInstance(state.txError)
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

export default AcceptTransfer
