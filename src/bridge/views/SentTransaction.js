import Maybe from 'folktale/maybe'
import React from 'react'
import { Row, Col, H1, H3, P, Warning, Anchor } from '../components/Base'
import { Button } from '../components/Base'

import { ROUTE_NAMES } from '../lib/router'
import { BRIDGE_ERROR, renderTxnError } from '../lib/error'
import { NETWORK_NAMES } from '../lib/network'


class Success extends React.Component {

  constructor(props) {
    super(props)

    this.state = {
      pending: '.',
      interval: null
    }
  }

  componentDidMount() {
    const nextDot = {'.': '..',
                     '..': '...',
                     '...': '.'}

    const interval = setInterval(() => {
      this.setState(({ pending }) => ({pending: nextDot[pending]}))
    }, 1000)
    this.setState({interval: interval})
  }

  componentWillUnmount() {
    clearInterval(this.state.interval)
  }

  render() {

    const { props, state } = this
    const { networkType, hash, txnConfirmations } = props
    const { pending } = state

    const esvisible =
          networkType === NETWORK_NAMES.ROPSTEN ||
          networkType === NETWORK_NAMES.MAINNET

    const esdomain =
          networkType === NETWORK_NAMES.ROPSTEN
          ? "ropsten.etherscan.io"
          : "etherscan.io"

    const esmessage =
          esvisible === true
          ? "If you’d like to keep track of it, click the Etherscan link below."
          : ''

    const esanchor =
          esvisible === false
          ? null
          : <Anchor
          className={'mb-4 mt-1'}
          prop-size={'sm'}
          target={'_blank'}
          href={`https://${esdomain}/tx/${hash}`}>
                   {'View on Etherscan ↗'}
                 </Anchor>

    const confirmations = Maybe.fromNullable(txnConfirmations[hash]).getOrElse(0)

    const requiredConfirmations = 1

    const status = confirmations < requiredConfirmations ?
          `Pending${pending}` : `Confirmed! (x${confirmations} confirmations)!`

    return (
      <Row>
        <Col>
          <H1>{ 'Your Transaction was Sent' }</H1>

          <P>
            {
              `We sent your transaction to the chain. It can take some time to
            execute, especially if the network is busy. ${esmessage}`
            }
          </P>

          <H3>{ 'Transaction Hash' }</H3>
          <P>
            { hash }
          </P>

          <H3>{ 'Transaction Status' }</H3>
          <P>
            { status }
          </P>
          <P>
            { esanchor }
          </P>

        </Col>
      </Row>
    )
  }
}

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
  const { web3, txnHashCursor, networkType, popRoute, pushRoute, txnConfirmations} = props
  const { setPointCursor, pointCursor } = props

  const promptKeyfile = props.routeData && props.routeData.promptKeyfile

  const w3 = web3.matchWith({
    Nothing: _ => { throw BRIDGE_ERROR.MISSING_WEB3 },
    Just: res => res.value
  })

  const result = txnHashCursor.matchWith({
    Nothing: _ => { throw BRIDGE_ERROR.MISSING_TXN },
    Just: res => res.value
  })

  const body = result.matchWith({
    Error: message => <Failure web3={ w3 } message={ message.value } />,
    Ok: hash =>
      <Success
        hash={ hash.value }
        networkType={ networkType }
        txnConfirmations={ txnConfirmations }
      />
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

  let keyfile;

  if (promptKeyfile) {
    keyfile = (
      <Row>
        <Col>
          <Button
            prop-type={'link'}
            onClick={
              () => {
                popRoute()
                pushRoute(ROUTE_NAMES.GEN_KEYFILE)
              }
            }>
            { 'Download Keyfile →' }
          </Button>
        </Col>
      </Row>
    )
  }

  return (
    <div>
      { body }
      { ok }
      { keyfile }
    </div>
  )
}

export default SentTransaction
