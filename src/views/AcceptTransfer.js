import Maybe from 'folktale/maybe'
import React from 'react'
import { Row, Col, H1, H3, P, Form, Warning } from '../components/Base'
import { InnerLabel, AddressInput, ShowBlockie, Anchor } from '../components/Base'
import * as azimuth from 'azimuth-js'
import * as ob from 'urbit-ob'

import StatelessTransaction from '../components/StatelessTransaction'
import { BRIDGE_ERROR } from '../lib/error'
import { ROUTE_NAMES } from '../lib/router'

import {
  sendSignedTransaction,
  fromWei,
 } from '../lib/txn'

import {
  isValidAddress,
  addressFromSecp256k1Public,
} from '../lib/wallet'


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
      txn: Maybe.Nothing(),
      txError: Maybe.Nothing(),
      incomingPoint: incomingPoint,
      userApproval: false,
      nonce: '',
      gasPrice: '5',
      chainId: '',
      gasLimit: '600000',
      stx: Maybe.Nothing(),
    }
    this.handleAddressInput = this.handleAddressInput.bind(this)
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

    // const validPoint = props.pointCursor.matchWith({
    //   Just: (shp) => shp.value,
    //   Nothing: () => {
    //     throw BRIDGE_ERROR.MISSING_POINT
    //   }
    // })

    // NB (jtobin):
    //
    // We need to get the point's owner, so it's not possible to perform this
    // transaction offline.
    //
    // Perhaps we could add an 'owner' input in the offline case, if necessary.

    // const owner = props.pointCache[validPoint].owner
    //
    // const txn = Maybe.Just(this.createUnsignedTxn(
    //   owner,
    // state.receivingAddress))
    //
    // this.setState({ txn })
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



  handleSubmit() {
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

    return Maybe.Just(azimuth.ecliptic.transferFrom(
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
    const canSign = !Maybe.Nothing.hasInstance(state.txn)
    const canApprove = !Maybe.Nothing.hasInstance(state.stx)
    const canSend = !Maybe.Nothing.hasInstance(state.stx) && state.userApproval === true


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
          <Form>
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
            prop-disabled={!isValidAddress(state.receivingAddress)}
            target={'_blank'}
            href={`https://etherscan.io/address/${state.receivingAddress}`}>
              {'View on Etherscan ↗'}
          </Anchor>

          <StatelessTransaction
            // Upper scope
            web3={props.web3}
            contracts={props.contracts}
            wallet={props.wallet}
            walletType={props.walletType}
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

          </Form>

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

export default AcceptTransfer
