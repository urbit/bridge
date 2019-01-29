import Maybe from 'folktale/maybe'
import React from 'react'

import { Code, H3 } from './Base'
import { Button } from './Base'
import { CheckboxButton, Input, InnerLabel }  from './Base'

import {
  renderSignedTx,
  // createUnsignedTxn,
  signTransaction,
} from '../lib/txn';



const StatelessTransaction = props => {

  const generateButtonColor = Maybe.Nothing.hasInstance(props.txn)
    ? 'blue'
    : 'green'

  const signerButtonColor = Maybe.Nothing.hasInstance(props.stx)
    ? 'blue'
    : 'green'

  return (
      <React.Fragment>

        <Button
          prop-size={'lg wide'}
          prop-color={generateButtonColor}
          className={'mt-8'}
          disabled={ !props.canGenerate }
          onClick={ () => props.createUnsignedTxn()}>
          { 'Generate Transaction' }
        </Button>


        {
          props.txn.matchWith({
            Nothing: () => '',
            Just: (tx) => {
              console.log(tx.value)
              const rendered = tx.value
              return (
                <React.Fragment>
                  <H3 className={'mt-8'}>{'Unsigned Transaction'}</H3>
                  <Code> {JSON.stringify(rendered, null, 2)} </Code>
                </React.Fragment>
              )
            }
          })
        }


        <Input
          className='mono mt-4'
          prop-size='md'
          prop-format='innerLabel'
          value={ props.gasPrice }
          onChange={ v => props.setGasPrice(v) }>
          <InnerLabel>
            { 'Gas Price (gwei)' }
          </InnerLabel>
        </Input>

        <Input
          className='mono mt-4'
          prop-size='md'
          prop-format='innerLabel'
          value={ props.gasLimit }
          onChange={ v => props.setGasLimit(v) }>
          <InnerLabel>
            { 'Gas Limit' }
          </InnerLabel>
        </Input>

        {
          props.web3.matchWith({
            Just: () => <div />,
            Nothing: () =>
              <React.Fragment>
                <Input
                  className='mono mt-4'
                  prop-size='md'
                  prop-format='innerLabel'
                  value={ props.nonce }
                  onChange={ v => props.setNonce(v) }>
                  <InnerLabel>
                    { 'Nonce' }
                  </InnerLabel>
                </Input>

                <Input
                  className='mono mt-4 mb-8'
                  prop-size='md'
                  prop-format='innerLabel'
                  value={ props.chainId }
                  onChange={ v => props.setChainId(v) }>
                  <InnerLabel>
                    { 'Chain ID' }
                  </InnerLabel>
                </Input>
              </React.Fragment>
          })
        }

        <Button
          disabled={ !props.canSign }
          className={'mt-8'}
          prop-size={'lg wide'}
          prop-color={signerButtonColor}
          onClick={ () => signTransaction({
            wallet: props.wallet,
            walletType: props.walletType,
            walletHdPath: props.walletHdPath,
            networkType: props.networkType,
            txn: props.txn,
            setStx: props.setStx,
            nonce: props.nonce,
            chainId: props.chainId,
            gasPrice: props.gasPrice,
            gasLimit: props.gasLimit,
          }) }>
          { 'Sign Transaction' }
        </Button>


        {
          props.stx.matchWith({
            Nothing: () => '',
            Just: (tx) => {
              const rendered = renderSignedTx(tx.value)
              return (
                <React.Fragment>
                  <H3 className={'mt-8'}>{'Signed Transaction'}</H3>
                  <Code> {JSON.stringify(rendered, null, 2)} </Code>
                </React.Fragment>
              )
            }
          })
        }

        {
          props.web3.matchWith({
            Nothing: () => '',
            Just: () => {
              return (
                <React.Fragment>
                  <CheckboxButton
                    className={'mt-8'}
                    disabled={ !props.canApprove }
                    onClick={ () => props.setUserApproval() }
                    state={props.userApproval}>
                    <div>
                      { `I approve this transaction and wish to send.` }
                    </div>
                  </CheckboxButton>
                  <Button
                    prop-size={'xl wide'}
                    className={'mt-8'}
                    disabled={ !props.canSend }
                    onClick={ () => props.handleSubmit() }>
                    { 'Send Transaction' }
                  </Button>
                </React.Fragment>
              )
            }
          })
        }
    </React.Fragment>
  )
}



export default StatelessTransaction
