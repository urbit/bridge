import { Nothing } from 'folktale/maybe'
import React from 'react'

import { Code, H3 } from './Base'
import { Button } from './Base'
import { CheckboxButton, Input, InnerLabel } from './Base'

import { renderSignedTx, signTransaction } from '../lib/txn'

class StatelessTransaction extends React.Component {

  constructor(props) {
    super(props)

    this.state = {
      gasPrice: '5',
      gasLimit: '600000',
      showGasDetails: false,
      userApproval: false,
      chainId: '',
      nonce: '',
      stx: Nothing(),
      txn: Nothing(),
      txError: Nothing(),
    }

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

  handleSubmit(){
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

  handleSetUserApproval(){
    const {state} = this
    this.setState({ userApproval: !state.userApproval })
  }

  toggleGasDetails() {
    this.setState({
      showGasDetails: !this.state.showGasDetails
    })
  }

  handleSetStx(stx){
    this.setState({
      stx,
      userApproval: false,
    })
  }

  handleSetTxn(txn){
    this.setState({ txn })
  }

  handleCreateUnsignedTxn() {
    const txn = this.props.createUnsignedTxn()
    this.setState({ txn })
  }

  handleClearTxn() {
    this.setState({
      userApproval: false,
      txn: Maybe.Nothing(),
      stx: Maybe.Nothing(),
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

  handleRangeChange(e) => {
    this.handleSetGasPrice(e.target.value);
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

  // TODO: Investigate
  // setState doesn't seem to work in SetProxy/handleSubmit;
  //   - TypeError: Cannot read property 'updater' of undefined
  // so just modifying the DOM manually here. (https://imgur.com/a/i0Qsyq1)

  sendTxn(e) {
    e.target.setAttribute("disabled", true);
    let spinner = e.target.querySelectorAll('.btn-spinner')[0];
    spinner.classList.remove('hide');
    this.handleSubmit()
  }

  render() {
    const { web3, createUnsignedTxn, canGenerate } = this.props
    const { gasPrice, gasLimit, nonce, chainId, txn, stx, userApproval } = this.state

    const { setNonce, setChainId, setGasLimit, setGasPrice, handleSubmit } = this
    const { showGasDetails, toggleGasDetails, setUserApproval } = this

    const canSign = Maybe.Just.hasInstance(state.txn)
    const canApprove = Maybe.Just.hasInstance(state.stx)
    const canSend = Maybe.Just.hasInstance(state.stx) && state.userApproval === true

    const generateButtonColor =
        Nothing.hasInstance(txn)
      ? 'blue'
      : 'green'

    const signerButtonColor =
        Nothing.hasInstance(stx)
      ? 'blue'
      : 'green'

    const generateTxnButton =
      <Button
        className={ 'mt-8' }
        disabled={ !canGenerate }
        prop-color={ generateButtonColor }
        prop-size={ 'lg wide' }
        onClick={ createUnsignedTxn }
      >
        { 'Generate Transaction' }
      </Button>

    const unsignedTxnDisplay = txn.matchWith({
      Nothing: _ => '',
      Just: tx =>
        <React.Fragment>
          <H3 className={ 'mt-8' }>
            { 'Unsigned Transaction' }
          </H3>
          <Code>
            { JSON.stringify(tx.value, null, 2) }
          </Code>
        </React.Fragment>
    })

    const gasPriceRangeDialogue = (
      <React.Fragment>
        <div className="mt-12 flex space-between align-baseline">
          <div>
            <span>Gas Price:</span>
            <span className="ml-4 text-700 text-sm">{gasPrice} gwei</span>
          </div>
          <div className="text-sm">
            <span>Max transaction fee: </span>
            <span className="text-700">{(gasPrice * gasLimit) / 1000000000} eth</span>
          </div>
        </div>

        <input
          className="mt-4"
          type="range"
          min="2"
          max="20"
          list="gweiVals"
          value={gasPrice}
          onChange={handleRangeChange}
          />

        <div className="flex space-between text-sm mb-8">
          <div>Cheap</div>
          <div>Fast</div>
        </div>
      </React.Fragment>
    )

    const toggleGasDetailsDialogue = (
      <a href="javascript:void(0)" onClick={toggleGasDetails}>Gas Details</a>
    )

    const gasPriceDialogue =
      <Input
        className={ 'mono mt-4' }
        prop-size={ 'md' }
        prop-format={ 'innerLabel' }
        value={ gasPrice }
        onChange={ setGasPrice }
      >
        <InnerLabel>
          { 'Gas Price (gwei)' }
        </InnerLabel>
      </Input>

    const gasLimitDialogue =
      <Input
        className={ 'mono mt-4' }
        prop-size={ 'md' }
        prop-format={ 'innerLabel' }
        value={ gasLimit }
        onChange={ setGasLimit }>
        <InnerLabel>
          { 'Gas Limit' }
        </InnerLabel>
      </Input>

    const nonceDialogue =
      <Input
        className={ 'mono mt-4' }
        prop-size={ 'md' }
        prop-format={ 'innerLabel' }
        value={ nonce }
        onChange={ setNonce }
      >
        <InnerLabel>
          { 'Nonce' }
        </InnerLabel>
      </Input>

    const chainDialogue =
      <Input
        className={ 'mono mt-4 mb-8' }
        prop-size={ 'md' }
        prop-format={ 'innerLabel' }
        value={ chainId }
        onChange={ setChainId }
      >
        <InnerLabel>
          { 'Chain ID' }
        </InnerLabel>
      </Input>

    const onlineParamsDialogue = web3.matchWith({
      Just: _ => <div />,
      Nothing: _ =>
        <React.Fragment>
          { nonceDialogue }
          { chainDialogue }
        </React.Fragment>
    })

    const signTxnButton =
      <Button
        disabled={ !canSign }
        className={ 'mt-8' }
        prop-size={ 'lg wide' }
        prop-color={ signerButtonColor }
        onClick={ () => signTransaction(this.props) }
      >
        { 'Sign Transaction' }
      </Button>

    const signedTxnDisplay = stx.matchWith({
      Nothing: _ => '',
      Just: tx =>
        <React.Fragment>
          <H3 className={ 'mt-8' }>
            { 'Signed Transaction' }
          </H3>
          <Code>
            { JSON.stringify(renderSignedTx(tx.value), null, 2) }
          </Code>
        </React.Fragment>
    })

    const confirmButton =
      <CheckboxButton
        className={ 'mt-8' }
        disabled={ !canApprove }
        onClick={ setUserApproval }
        state={ userApproval }
      >
        <div>
          { `I approve this transaction and wish to send.` }
        </div>
      </CheckboxButton>

    const sendTxnButton =
      <Button
        prop-size={ 'xl wide' }
        className={ 'mt-8' }
        disabled={ !canSend }
        onClick={ sendTxn }
      >
        <span className="relative">
          <span className="btn-spinner hide"></span>
          { 'Send Transaction' }
        </span>
      </Button>

    const sendDialogue = web3.matchWith({
      Nothing: _ => '',
      Just: _ =>
        <React.Fragment>
          { confirmButton }
          { sendTxnButton }
        </React.Fragment>
    })

    return (
      <React.Fragment>
        { generateTxnButton }
        { unsignedTxnDisplay }

        { gasPriceRangeDialogue }
        { toggleGasDetailsDialogue }

        { showGasDetails &&
          <div>
            { gasPriceDialogue }
            { gasLimitDialogue }
          </div>
        }
        { onlineParamsDialogue }

        { signTxnButton }

        { signedTxnDisplay }
        { sendDialogue }
      </React.Fragment>
    )
  }
}

export default StatelessTransaction
