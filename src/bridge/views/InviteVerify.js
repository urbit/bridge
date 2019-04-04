import { Just, Nothing } from 'folktale/maybe'
import React from 'react'
import { pour } from 'sigil-js'
import * as ob from 'urbit-ob'
import * as azimuth from 'azimuth-js'

import { ROUTE_NAMES } from '../lib/router'

import { InnerLabel, TicketInput } from '../components/Base'
import ReactSVGComponents from '../components/ReactSVGComponents'
import KeysAndMetadata from './Point/KeysAndMetadata'
import Actions from './Point/Actions'
import { BRIDGE_ERROR } from '../lib/error'
import { Row, Col, Warning, Button, H1, H3 } from '../components/Base'

//TODO from Ticket.js, move to lib
const placeholder = (len) => {
  let bytes = window.crypto.getRandomValues(new Uint8Array(len))
  let hex = bytes.reduce((acc, byt) =>
    acc + byt.toString(16).padStart(2, '0'),
    ''
  )
  return ob.hex2patq(hex)
}

class InviteVerify extends React.Component {

  constructor(props) {
    super(props)

    this.state = {
      point: this.props.routeData.point,
      realTicket: this.props.routeData.ticket
    }

    this.ticketPlaceholder = placeholder(8);
    this.handleTicketInput = this.handleTicketInput.bind(this);
    this.proceed = this.proceed.bind(this);
  }

  componentDidMount() {
    //
  }

  componentDidUpdate(prevProps) {
    //
  }

  handleTicketInput(ticket) {
    this.setState({ ticket })
  }

  proceed() {
    this.props.pushRoute(ROUTE_NAMES.INVITE_TRANSACTIONS, {
      ticket: this.state.realTicket,
      point: this.state.point
    });
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

    return (
      <Row>
        <Col>

          { pointOverview }

          <p>{`Please input the master ticket for ${point} that you downloaded in the previous step.`}</p>

          <TicketInput
            className='mono mt-8'
            prop-size='lg'
            prop-format='innerLabel'
            type='password'
            name='ticket'
            placeholder={ `e.g. ${this.ticketPlaceholder}` }
            value={ this.state.ticket }
            onChange={ this.handleTicketInput }>
            <InnerLabel>{ 'Ticket' }</InnerLabel>
          </TicketInput>

          <Button
            className={'mt-4'}
            prop-size={'xl wide'}
            disabled={(this.state.ticket !== this.state.realTicket)}
            onClick={this.proceed}
          >
            { 'Continue →' }
          </Button>

        </Col>
      </Row>
    )
  }
}

export default InviteVerify
