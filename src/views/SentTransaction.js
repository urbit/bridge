import React from 'react'
import { Row, Col, H1, H3, P, Warning, Anchor } from '../components/Base'
import { Button } from '../components/Base'

import { BRIDGE_ERROR, renderTxnError } from '../lib/error'

const Success = (props) =>
    <Row>
      <Col>
        <H1>{ 'Your Transaction was Sent' }</H1>

        <P>
          {
            `We sent your transaction to the chain. It can take some time to
            execute, especially if the network is busy. If you’d like to keep
            track of it, click the Etherscan link below.`
          }
        </P>

        <H3>{ 'Transaction Hash' }</H3>
        <P>
          { props.hash }
        </P>
        <Anchor
          className={'mb-4 mt-1'}
          prop-size={'sm'}
          target={'_blank'}
          href={`https://etherscan.io/tx/${props.hash}`}>
            {'View on Etherscan ↗'}
        </Anchor>
      </Col>
    </Row>

const Failure = (props) =>

    <Row>
      <Col>
        <H1>{ 'Error!' }</H1>


        <Warning>
          <H3>
            {
              'There was an error sending your transaction.'
            }
          </H3>
          { renderTxnError(props.web3, props.message) }
        </Warning>
      </Col>
    </Row>

const SentTransaction = (props) => {
  const { web3, txnCursor, popRoute } = props
  const { setPointCursor, pointCursor } = props

  const w3 = web3.matchWith({
    Nothing: _ => { throw BRIDGE_ERROR.MISSING_WEB3 },
    Just: res => res.value
  })

  const result = txnCursor.matchWith({
    Nothing: _ => { throw BRIDGE_ERROR.MISSING_TXN },
    Just: res => res.value
  })

  const body = result.matchWith({
    Error: message => <Failure web3={ w3 } message={ message.value } />,
    Ok: txn => <Success hash={ txn.value.transactionHash } />
  })

  const ok =
    <Row>
      <Col>
        <Button
          prop-type={'link'}
          onClick={
            () => {
              setPointCursor(pointCursor)
              popRoute()
            }
          }>
          { 'Ok →' }
        </Button>
      </Col>
    </Row>

  return (
    <div>
      { body }
      { ok }
    </div>
  )
}

export default SentTransaction
