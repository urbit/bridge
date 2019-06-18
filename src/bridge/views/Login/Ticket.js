import { Just, Nothing } from 'folktale/maybe';
import React from 'react';
import * as azimuth from 'azimuth-js';
import * as ob from 'urbit-ob';

import {
  Button,
  Row,
  Col,
  H1,
  P,
  InnerLabel,
  ValidatedSigil,
  PointInput,
  TicketInput,
  Input,
  InputCaption,
} from '../../components/Base';

import * as need from '../../lib/need';
import { randomPatq, compose } from '../../lib/lib';
import { ROUTE_NAMES } from '../../lib/routeNames';
import { WALLET_TYPES, urbitWalletFromTicket } from '../../lib/wallet';

import { withHistory } from '../../store/history';
import { withWallet } from '../../store/wallet';
import { withNetwork } from '../../store/network';
import { withPointCursor } from '../../store/pointCursor';

//TODO should be part of InputWithStatus component
const INPUT_STATUS = {
  SPIN: Symbol('SPIN'),
  GOOD: Symbol('GOOD'),
  FAIL: Symbol('FAIL'),
};

class Ticket extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      pointName: '',
      ticket: '',
      ticketStatus: Nothing(),
      passphrase: '',
      wallet: Nothing(),
    };

    this.handlePointNameInput = this.handlePointNameInput.bind(this);
    this.handleTicketInput = this.handleTicketInput.bind(this);
    this.handlePassphraseInput = this.handlePassphraseInput.bind(this);
    this.verifyTicket = this.verifyTicket.bind(this);
    this.continue = this.continue.bind(this);
  }

  componentDidMount() {
    //TODO deduce point name from URL if we can, prefill input if we found it
  }

  handlePointNameInput(pointName) {
    if (pointName.length < 15) {
      this.setState({ pointName });
      this.verifyTicket(pointName, this.state.ticket, this.state.passphrase);
    }
  }

  handleTicketInput(ticket) {
    this.setState({ ticket });
    this.verifyTicket(this.state.pointName, ticket, this.state.passphrase);
  }

  handlePassphraseInput(passphrase) {
    this.setState({ passphrase });
    this.verifyTicket(this.state.pointName, this.state.ticket, passphrase);
  }

  //TODO maybe want to do this only on-go, because wallet derivation is slow...
  async verifyTicket(pointName, ticket, passphrase) {
    if (!ob.isValidPatq(ticket) || !ob.isValidPatp(pointName)) {
      this.setState({ ticketStatus: Nothing(), wallet: Nothing() });
      return;
    }
    this.setState({ ticketStatus: Just(INPUT_STATUS.SPIN) });
    const contracts = need.contracts(this.props);
    const pointNumber = ob.patp2dec(pointName);
    const uhdw = await urbitWalletFromTicket(ticket, pointName, passphrase);
    const isOwner = azimuth.azimuth.isOwner(
      contracts,
      pointNumber,
      uhdw.ownership.keys.address
    );
    const isTransferProxy = azimuth.azimuth.isTransferProxy(
      contracts,
      pointNumber,
      uhdw.ownership.keys.address
    );
    let newState = { wallet: Just(uhdw) };
    newState.ticketStatus =
      (await isOwner) || (await isTransferProxy)
        ? Just(INPUT_STATUS.GOOD)
        : Just(INPUT_STATUS.FAIL);
    this.setState(newState);
  }

  canContinue() {
    // this is our only requirement, since we still want people with
    // non-standard wallet setups to be able to log in
    return Just.hasInstance(this.state.wallet);
  }

  continue() {
    this.props.setWalletType(WALLET_TYPES.TICKET);
    this.props.setUrbitWallet(this.state.wallet.value); //TODO wrap
    this.props.setPointCursor(Just(ob.patp2dec(this.state.pointName)));
    this.props.loginCompleted();
  }

  render() {
    const { history, wallet } = this.props;

    const pointInput = (
      <PointInput
        className="mono mt-8"
        prop-size="lg"
        prop-format="innerLabel"
        type="text"
        autoFocus
        value={this.state.pointName}
        onChange={this.handlePointNameInput}>
        <InnerLabel>{'Point name'}</InnerLabel>
        <ValidatedSigil
          className={'tr-0 mt-05 mr-0 abs'}
          patp={this.state.pointName}
          size={68}
          margin={8}
        />
      </PointInput>
    );

    const ticketStatus = this.state.ticketStatus.matchWith({
      Nothing: () => <span />,
      Just: status => {
        switch (status.value) {
          case INPUT_STATUS.SPIN:
            return <span>⋯</span>;
          case INPUT_STATUS.GOOD:
            return <span>✓</span>;
          case INPUT_STATUS.FAIL:
            return <span>𐄂</span>;
          default:
            throw new Error('weird input status ' + status.value);
        }
      },
    });

    const ticketInput = (
      //TODO NewTicketInput component, that does dashes etc
      <TicketInput
        className="mono mt-8"
        prop-size="lg"
        prop-format="innerLabel"
        type="password"
        name="ticket"
        value={this.state.ticket}
        onChange={this.handleTicketInput}>
        <InnerLabel>{'Master ticket'}</InnerLabel>
        {ticketStatus}
      </TicketInput>
    );

    // const passphraseInput = !this.props.advanced ? null : (
    //   <Input
    //     className="mt-8"
    //     prop-size="md"
    //     prop-format="innerLabel"
    //     name="passphrase"
    //     type="password"
    //     value={this.state.passphrase}
    //     autocomplete="off"
    //     onChange={this.handlePassphraseInput}>
    //     <InnerLabel>{'Passphrase'}</InnerLabel>
    //   </Input>
    // );

    return (
      <Row>
        <Col>
          {pointInput}
          {ticketInput}

          <Button
            className={'mt-10'}
            disabled={!this.canContinue()}
            onClick={this.continue}>
            {'Go  →'}
          </Button>
        </Col>
      </Row>
    );
  }
}

export default compose(
  withHistory,
  withWallet,
  withNetwork,
  withPointCursor
)(Ticket);
