import { Nothing } from 'folktale/maybe'
import React from 'react'

import { Code, H3 } from './Base'
import { Button } from './Base'
import { CheckboxButton, Input, InnerLabel } from './Base'

import { renderSignedTx, signTransaction } from '../lib/txn'

const StatelessTransaction = props => {
  const { web3, gasPrice, gasLimit, nonce, chainId } = props
  const { setNonce, setChainId, setGasLimit, setGasPrice, showGasDetails, toggleGasDetails } = props
  const { txn, stx, createUnsignedTxn } = props
  const { canSign, canGenerate, canApprove } = props
  const { setUserApproval, userApproval } = props
  const { canSend, handleSubmit } = props

  // setState doesn't seem to work in SetProxy/handleSubmit, so just
  // modifying the DOM manually here. (https://imgur.com/a/i0Qsyq1)

  const handleRangeChange = (e) => {
    setGasPrice(e.target.value);
  }

  const sendTxn = (e) => {
    e.target.setAttribute("disabled", true);
    let spinner = e.target.querySelectorAll('.btn-spinner')[0];
    spinner.classList.remove('hide');
    handleSubmit()
  }

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
      <div className="mt-8">Gas Price: <span className="ml-4 text-700 text-sm">{(gasPrice / 1000000000).toFixed('9')} eth</span></div>

      <input
        className="mt-4"
        type="range"
        min="4"
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
      onClick={ () => signTransaction(props) }
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

export default StatelessTransaction
