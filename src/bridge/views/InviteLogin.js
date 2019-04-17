import { Just, Nothing } from 'folktale/maybe'
import React from 'react'
import { Button } from '../components/Base'
import { InnerLabel, ValidatedSigil, PointInput, TicketInput } from '../components/Base'
import { Row, Col, H1, P } from '../components/Base'
import * as kg from '../../../node_modules/urbit-key-generation/dist/index'
import * as ob from 'urbit-ob'

import { ROUTE_NAMES } from '../lib/router'
import { DEFAULT_HD_PATH, urbitWalletFromTicket } from '../lib/wallet'

const placeholder = (len) => {
  let bytes = window.crypto.getRandomValues(new Uint8Array(len))
  let hex = bytes.reduce((acc, byt) =>
    acc + byt.toString(16).padStart(2, '0'),
    ''
  )
  return ob.hex2patq(hex)
}

class InviteLogin extends React.Component {

  constructor(props) {
    super(props)

    this.state = {
      ticket: '',
      pointName: '',
      isUnlocking: false
    }

    this.pointPlaceholder = placeholder(4)
    this.ticketPlaceholder = placeholder(12)

    this.handleTicketInput = this.handleTicketInput.bind(this)
    this.navigateLogin = this.navigateLogin.bind(this)
  }

  navigateLogin() {
    this.props.popRoute()
    this.props.pushRoute(ROUTE_NAMES.NETWORK)
  }

  handleTicketInput(ticket) {
    this.setState({ ticket })
  }

  async walletFromTicket(ticket, pointName) {
    this.setState({
      isUnlocking: true
    });

    const uhdw = await urbitWalletFromTicket(ticket, '~zod');
    this.props.setUrbitWallet(Just(uhdw));

    this.setState({
      isUnlocking: false
    });
    this.props.pushRoute(ROUTE_NAMES.INVITE_WALLET);
  }

  render() {
    const { wallet } = this.props
    const { ticket, pointName } = this.state

    const phTick = this.ticketPlaceholder

    return (
      <Row>
        <Col className="col-md-4">
          <H1>{ 'Welcome' }</H1>

          <TicketInput
            className='mono mt-8'
            prop-size='md'
            prop-format='innerLabel'
            type='text'
            autoFocus
            name='invite'
            placeholder={ `e.g. ${phTick}` }
            value={ ticket }
            onChange={ this.handleTicketInput }>
            <InnerLabel>{ 'Activation code' }</InnerLabel>
          </TicketInput>

          <Button
            className={'mt-8'}
            prop-size={'lg'}
            disabled={this.state.isUnlocking}
            prop-color={'black'}
            onClick={() => this.walletFromTicket(ticket, pointName)}>

            <span className="relative">
              {this.state.isUnlocking &&
                <span className="btn-spinner"></span>
              }
              {'Continue →'}
            </span>
          </Button>

          <Button
            prop-type={`link`}
            prop-size={`sm`}
            className={`block mt-4`}
            onClick={this.navigateLogin} >
            {`Log in`}
          </Button>

        </Col>
      </Row>
    )
  }
}

export default InviteLogin
