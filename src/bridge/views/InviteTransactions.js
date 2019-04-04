import { Just, Nothing } from 'folktale/maybe'
import React from 'react'
import { pour } from 'sigil-js'
import * as ob from 'urbit-ob'
import * as azimuth from 'azimuth-js'

import { EthereumWallet } from '../lib/wallet'

import ReactSVGComponents from '../components/ReactSVGComponents'
import KeysAndMetadata from './Point/KeysAndMetadata'
import Actions from './Point/Actions'
import { BRIDGE_ERROR } from '../lib/error'
import { Row, Col, Warning, Button, H1, H3 } from '../components/Base'


class InviteVerify extends React.Component {

  constructor(props) {
    super(props)

    this.state = {
      point: this.props.routeData.point,
      ticket: this.props.routeData.ticket
    }
  }

  componentDidMount() {
    //TODO start transactions
    // - sign transfer transaction to new wallet with invite wallet
    // - ping gas tank if needed
    // - wait for tx confirm
    // - sign configuration transactions (management, networking) with new wallet
    // - ping gas tank if needed
    // - wait for tx confirms
  }

  componentDidUpdate(prevProps) {
    //
  }

  render() {

    const { point } = this.state;

    const name = ob.patp(point);
    const sigil = pour({
      patp: name,
      renderer: ReactSVGComponents,
      size: 256
    });
    let pointOverview = (
      //TODO Passport display component
      <>
        <div className={'mt-12 pt-6'}>
          { sigil }
        </div>
        <H3><code>{ name }</code></H3>
      </>
    );

    console.log('tickets', this.state.ticket, this.state.realTicket, (this.state.realTicket === this.state.ticket));
    return (
      <Row>
        <Col>

          { pointOverview }

          <p>{ 'Please wait while your wallet and point are prepared for use.' }</p>

        </Col>
      </Row>
    )
  }
}

export default InviteVerify
