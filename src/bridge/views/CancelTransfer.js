import Maybe from 'folktale/maybe'
import React from 'react'
import { Row, Col, H1, P } from '../components/Base'
import * as azimuth from 'azimuth-js'
import * as ob from 'urbit-ob'

import StatelessTransaction from '../components/StatelessTransaction'
import { BRIDGE_ERROR } from '../lib/error'
import { ETH_ZERO_ADDR } from '../lib/wallet'

class CancelTransfer extends React.Component {
  constructor(props) {
    super(props)

    const pointInTransfer = props.pointCursor.matchWith({
      Just: (pt) => pt.value,
      Nothing: () => {
        throw BRIDGE_ERROR.MISSING_POINT
      }
    })

    this.state = {
      proxyAddress: '',
      pointInTransfer: pointInTransfer,
    }

    this.createUnsignedTxn = this.createUnsignedTxn.bind(this)
  }

  createUnsignedTxn() {
    const { props } = this

    const validContracts = props.contracts.matchWith({
      Just: (cs) => cs.value,
      Nothing: () => {
        throw BRIDGE_ERROR.MISSING_CONTRACTS
      }
    })

    const validPoint = props.pointCursor.matchWith({
      Just: (pt) => pt.value,
      Nothing: () => {
        throw BRIDGE_ERROR.MISSING_POINT
      }
    })

    const txn = azimuth.ecliptic.setTransferProxy(
      validContracts,
      validPoint,
      ETH_ZERO_ADDR
    )

    return Maybe.Just(txn)
  }

  render() {
    const { props, state } = this

    const online = Maybe.Just.hasInstance(props.web3)

    const proxy = online
      ? props.pointCache[state.pointInTransfer].transferProxy
      : 'any outgoing addresses'

    // const canGenerate = validAddress === true

    const canGenerate = true

    return (
        <Row>
          <Col>
            <H1>
              { 'Cancel Transfer of '} <code>{ ` ${ob.patp(state.pointInTransfer)} ` }</code>
            </H1>

            <P>
            {
              `This action will cancel the transfer to ${proxy}.`
            }
            </P>
            <StatelessTransaction
              // Upper scope
              web3={props.web3}
              contracts={props.contracts}
              wallet={props.wallet}
              walletType={props.walletType}
              walletHdPath={props.walletHdPath}
              networkType={props.networkType}
              setTxnHashCursor={props.setTxnHashCursor}
              setTxnConfirmations={props.setTxnConfirmations}
              popRoute={props.popRoute}
              pushRoute={props.pushRoute}
              // Other
              canGenerate={ canGenerate }
              createUnsignedTxn={this.createUnsignedTxn} />
        </Col>
      </Row>
    )
  }
}

export default CancelTransfer
