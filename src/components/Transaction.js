import Maybe from 'folktale/maybe'
import Result from 'folktale/result'
import React from 'react'
import { Row, Col, Code, H3 } from './Base'
import { Button } from './Base'
import { CheckboxButton }  from './Base'

import Signer from './Transaction/Signer'
import { ROUTE_NAMES } from '../lib/router'
import { renderTxnPurpose } from '../lib/txn'
import { addHexPrefix } from '../lib/wallet'
import { BRIDGE_ERROR } from '../lib/error'

const hexify = val =>
  addHexPrefix(val.toString('hex'))

const renderSignedTx = stx => ({
  messageHash: hexify(stx.hash()),
  v: hexify(stx.v),
  s: hexify(stx.s),
  r: hexify(stx.r),
  rawTransaction: hexify(stx.serialize())
})

class Transaction extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      purposeConfirmed: false,
      looksGood: false,
      isSigned: false,
      txn: Maybe.Nothing(),
      stx: Maybe.Nothing()
    }

    this.handlePurposeConfirmation = this.handlePurposeConfirmation.bind(this)
    this.handleLooksGood = this.handleLooksGood.bind(this)
    this.setSignedTransaction = this.setSignedTransaction.bind(this)
    this.sendSignedTransaction = this.sendSignedTransaction.bind(this)
  }

  // createUnsignedTxn() {
  //   const { props, state } = this
  //   const txn = props.createUnsignedTxn()
  //   this.setState({ txn })
  // }

  setSignedTransaction(stx) {

    this.setState({
      isSigned: true,
      stx: Maybe.Just(stx)
    })
  }

  handlePurposeConfirmation() {
    this.setState({ purposeConfirmed: !this.state.purposeConfirmed })
  }

  handleLooksGood() {
    this.setState({ looksGood: !this.state.looksGood })
  }

  async sendSignedTransaction(web3, stx) {
    const txn = stx.matchWith({
      Just: (tx) => tx.value,
      Nothing: () => {
        throw BRIDGE_ERROR.MISSING_TXN
      }
    })

    const serializedTx = addHexPrefix(txn.serialize().toString('hex'))

    return new Promise((resolve, _) => {
      web3.eth.sendSignedTransaction(serializedTx)
        .on('receipt', txn =>
          resolve(Maybe.Just(Result.Ok(txn)))
        )
        .on('error', err => {
          resolve(Maybe.Just(Result.Error(err.message)))
        })
    })
  }

  render() {
    const { state, props } = this

    const { web3, wallet, walletType, purpose, setTxnCursor } = this.props
    const { pushRoute, popRoute } = this.props
    const { className } = this.props
    const { purposeConfirmed, looksGood, stx, isSigned, txn } = this.state

    return (
        <Row className={`${className}`}>
          <Col>


            <Button
              prop-size={'lg wide'}
              className={'mt-8'}
              disabled={ props.disabled }
              onClick={ () => this.createUnsignedTxn()}
            >
              { 'Generate Transaction' }
            </Button>

            {
              // <CheckboxButton
              //   className={'mt-8'}
              //   disabled={ Maybe.Nothing.hasInstance(txn) }
              //   onClick={ this.handlePurposeConfirmation }
              //   state={purposeConfirmed}>
              //   <div>
              //     { `Yes, I am sure I want to ${renderTxnPurpose(purpose)}.` }
              //   </div>
              // </CheckboxButton>
            }


            <Signer
              className={'mt-8'}
              web3={ web3 }
              wallet={ wallet }
              walletType={ walletType }
              txn={ txn }
              setSignedTransaction={ this.setSignedTransaction }
              disabled={ Maybe.Nothing.hasInstance(txn) } />



            { stx.matchWith({
              Nothing: () => '',
              Just: (tx) => {
                const rendered = renderSignedTx(tx.value)
                return (
                  <div>
                    <H3 className={'mt-8'}>{'Signed Transaction'}</H3>
                    <Code> {JSON.stringify(rendered, null, 2)} </Code>
                  </div>
                )
              }
            }) }

            {
              web3.matchWith({
              Nothing: () => <div />,
              Just: () =>
                <CheckboxButton
                  className={'mt-8 mb-4'}
                  disabled={ !(!Maybe.Nothing.hasInstance(stx) && isSigned && purposeConfirmed)}
                  onClick={ this.handleLooksGood }
                  state={looksGood}>
                  <div>
                    { `I approve this transaction and wish to send.` }
                  </div>
                </CheckboxButton>
              })
            }



            { web3.matchWith({
                Nothing: _ => <div />,
                Just: w3 =>
                  <Button
                    prop-size={'xl wide'}
                    className={'mt-8'}
                    disabled={ !looksGood }
                    onClick={ () => {
                      this.sendSignedTransaction(w3.value, stx)
                        .then(sent => {
                          setTxnCursor(sent)
                          popRoute()
                          pushRoute(ROUTE_NAMES.SENT_TRANSACTION)
                        })
                    }}
                  >
                    { 'Send Transaction' }
                  </Button>
              })
            }
          </Col>
        </Row>
    )
  }
}



export default Transaction
