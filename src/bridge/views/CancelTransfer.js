import Maybe from 'folktale/maybe'
import React from 'react'
import { Row, Col, H1, P } from '../components/Base'
import * as azimuth from 'azimuth-js'
import * as ob from 'urbit-ob'
import * as n from '../lib/need'

import StatelessTransaction from '../components/StatelessTransaction'
import { ETH_ZERO_ADDR } from '../lib/wallet'

class CancelTransfer extends React.Component {
  constructor(props) {
    super(props)

    const pointInTransfer = n.needPointCursor(props);

    this.state = {
      proxyAddress: '',
      pointInTransfer: pointInTransfer,
    }

    this.createUnsignedTxn = this.createUnsignedTxn.bind(this)
  }

  createUnsignedTxn() {
    const { props } = this

    const validContracts = n.needContracts(props);

    const validPoint = n.needPointCursor(props); //TODO this.state.pointInTransfer ?

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
              onSent={props.setTxnHashCursor}
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
