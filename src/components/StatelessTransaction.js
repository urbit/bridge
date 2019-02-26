import { Nothing } from 'folktale/maybe'
import React from 'react'

import { Code, H3 } from './Base'
import { Button } from './Base'
import { CheckboxButton, Input, InnerLabel }  from './Base'

import {
  renderSignedTx,
  signTransaction,
  } from '../lib/txn'

const StatelessTransaction = props => {

  const generateButtonColor =
      Nothing.hasInstance(props.txn)
    ? 'blue'
    : 'green'

  const signerButtonColor =
      Nothing.hasInstance(props.stx)
    ? 'blue'
    : 'green'

  const generateTxnButton =
    <Button
      className={ 'mt-8' }
      disabled={ !props.canGenerate }
      prop-color={ generateButtonColor }
      prop-size={ 'lg wide' }
      onClick={ () => props.createUnsignedTxn() }
    >
      { 'Generate Transaction' }
    </Button>

  const unsignedTxnDisplay = props.txn.matchWith({
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

  const gasPriceDialogue =
    <Input
      className={ 'mono mt-4' }
      prop-size={ 'md' }
      prop-format={ 'innerLabel' }
      value={ props.gasPrice }
      onChange={ props.setGasPrice }
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
      value={ props.gasLimit }
      onChange={ props.setGasLimit }>
      <InnerLabel>
        { 'Gas Limit' }
      </InnerLabel>
    </Input>

  const nonceDialogue =
    <Input
      className={ 'mono mt-4' }
      prop-size={ 'md' }
      prop-format={ 'innerLabel' }
      value={ props.nonce }
      onChange={ props.setNonce }
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
      value={ props.chainId }
      onChange={ props.setChainId }
    >
      <InnerLabel>
        { 'Chain ID' }
      </InnerLabel>
    </Input>

  const onlineParamsDialogue = props.web3.matchWith({
    Just: _ => <div />,
    Nothing: _ =>
      <React.Fragment>
        { nonceDialogue }
        { chainDialogue }
      </React.Fragment>
  })

  const signTxnButton =
    <Button
      disabled={ !props.canSign }
      className={ 'mt-8' }
      prop-size={ 'lg wide' }
      prop-color={ signerButtonColor }
      onClick={ () => signTransaction(props) }
    >
      { 'Sign Transaction' }
    </Button>

  const signedTxnDisplay = props.stx.matchWith({
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
      disabled={ !props.canApprove }
      onClick={ props.setUserApproval }
      state={ props.userApproval }
    >
      <div>
        { `I approve this transaction and wish to send.` }
      </div>
    </CheckboxButton>

  const sendTxnButton =
    <Button
      prop-size={ 'xl wide' }
      className={ 'mt-8' }
      disabled={ !props.canSend }
      onClick={ props.handleSubmit }
    >
      { 'Send Transaction' }
    </Button>

  const sendDialogue = props.web3.matchWith({
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

        { gasPriceDialogue }
        { gasLimitDialogue }
        { onlineParamsDialogue }

        { signTxnButton }

        { signedTxnDisplay }
        { sendDialogue }
    </React.Fragment>
  )
}



export default StatelessTransaction
