import { Just, Nothing } from 'folktale/maybe';
import React from 'react';
import { Button } from '../components/old/Base';
import {
  InnerLabel,
  ValidatedSigil,
  PointInput,
  TicketInput,
  Input,
  InputCaption,
} from '../components/old/Base';
import { H1, P } from '../components/old/Base';

import { randomPatq, compose } from '../lib/lib';
import { ROUTE_NAMES } from '../lib/routeNames';
import { withHistory } from '../store/history';
import { urbitWalletFromTicket } from '../lib/wallet';
import { withWallet } from '../store/wallet';
import View from 'components/View';

class Ticket extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      ticket: '',
      pointName: '',
      passphrase: '',
      isUnlocking: false,
    };

    this.pointPlaceholder = randomPatq(4);
    this.ticketPlaceholder = randomPatq(8);

    this.handleTicketInput = this.handleTicketInput.bind(this);
    this.handlePassphraseInput = this.handlePassphraseInput.bind(this);
    this.handlePointNameInput = this.handlePointNameInput.bind(this);
  }

  handleTicketInput(ticket) {
    this.setState({ ticket });
  }

  handlePassphraseInput(passphrase) {
    this.setState({ passphrase });
  }

  handlePointNameInput(pointName) {
    if (pointName.length < 15) {
      this.setState({ pointName });
    }
  }

  async walletFromTicket(ticket, pointName, passphrase) {
    this.setState({
      isUnlocking: true,
    });

    const uhdw = await urbitWalletFromTicket(ticket, pointName, passphrase);
    this.props.setUrbitWallet(Just(uhdw));

    this.setState({
      isUnlocking: false,
    });
  }

  render() {
    const { history, wallet } = this.props;
    const { ticket, pointName, passphrase } = this.state;

    const phPoint = this.pointPlaceholder;
    const phTick = this.ticketPlaceholder;

    return (
      <View>
        <H1>{'Authenticate'}</H1>

        <P>
          {`Please enter your point and Urbit master ticket here. This information is written on your Urbit HD paper wallets.`}
        </P>

        <PointInput
          className="mono mt-8"
          prop-size="lg"
          prop-format="innerLabel"
          type="text"
          autoFocus
          placeholder={`e.g. ${phPoint}`}
          value={pointName}
          onChange={this.handlePointNameInput}>
          <InnerLabel>{'Point'}</InnerLabel>
          <ValidatedSigil
            className={'tr-0 mt-05 mr-0 abs'}
            patp={pointName}
            size={68}
            margin={8}
          />
        </PointInput>

        <TicketInput
          className="mono mt-8"
          prop-size="lg"
          prop-format="innerLabel"
          type="password"
          name="ticket"
          placeholder={`e.g. ${phTick}`}
          value={ticket}
          onChange={this.handleTicketInput}>
          <InnerLabel>{'Ticket'}</InnerLabel>
        </TicketInput>

        <InputCaption>
          {'If your wallet requires a passphrase, you may enter it below.'}
        </InputCaption>

        <Input
          className="pt-8"
          prop-size="md"
          prop-format="innerLabel"
          name="passphrase"
          type="password"
          value={passphrase}
          autocomplete="off"
          onChange={this.handlePassphraseInput}>
          <InnerLabel>{'Passphrase'}</InnerLabel>
        </Input>

        <Button
          className={'mt-8'}
          prop-size={'lg wide'}
          disabled={this.state.isUnlocking || Just.hasInstance(wallet)}
          onClick={() => this.walletFromTicket(ticket, pointName, passphrase)}>
          <span className="relative">
            {this.state.isUnlocking && <span className="btn-spinner" />}
            {'Unlock Wallet →'}
          </span>
        </Button>

        <Button
          className={'mt-4'}
          prop-size={'xl wide'}
          disabled={Nothing.hasInstance(wallet)}
          onClick={() => history.popAndPush(ROUTE_NAMES.SHIPS)}>
          {'Continue →'}
        </Button>
      </View>
    );
  }
}

export default compose(
  withHistory,
  withWallet
)(Ticket);
