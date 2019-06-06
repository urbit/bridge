import { Just, Nothing } from 'folktale/maybe'
import React from 'react'
import * as azimuth from 'azimuth-js'

import { BRIDGE_ERROR } from '../lib/error'
import { hasReceived, sendMail } from '../lib/inviteMail'
import { Row, Col, Button, Input, H3, Warning } from '../components/Base'
import { addressFromSecp256k1Public } from '../lib/wallet'

// for wallet generation
import * as wg from '../../walletgen/lib/lib'

// for transaction generation and signing
import {
  signTransaction,
  sendSignedTransaction,
  waitForTransactionConfirm,
  hexify
} from '../lib/txn'
import * as tank from '../lib/tank'

const GAS_PRICE_GWEI = 20; // we pay the premium for faster ux
const GAS_LIMIT = 500000; //TODO fine-tune
const INVITE_COST = (GAS_PRICE_GWEI * 1000000000 * GAS_LIMIT);

const STATUS = {
  INPUT: 'Generate invites',
  GENERATING: 'Generating invites',
  CAN_SEND: 'Send invites',
  FUNDING: 'Funding invites',
  SENDING: 'Sending invites',
  DONE: 'Done'
}

const EMAIL_STATUS = {
  BUSY: '⋯',
  DONE: '✔',
  FAIL: '×'
}

class InvitesSend extends React.Component {

  constructor(props) {
    super(props)

    this.state = {
      invitesAvailable: Nothing(),
      invited: Nothing(),
      targets: [{ email: '', hasReceived: Nothing(), status: Nothing() }],
      status: STATUS.INPUT,
      errors: Nothing(),
      //
      invites: []
    }

    this.findInvited = this.findInvited.bind(this);
    this.generateInvites = this.generateInvites.bind(this);
    this.sendInvites = this.sendInvites.bind(this);
    this.canSend = this.canSend.bind(this);
    this.handleEmailInput = this.handleEmailInput.bind(this);
    this.addTarget = this.addTarget.bind(this);
    this.removeTarget = this.removeTarget.bind(this);
    this.setEmailStatus = this.setEmailStatus.bind(this);
    this.askForFunding = this.askForFunding.bind(this);
  }

  componentDidMount() {
    this.point = this.props.pointCursor.matchWith({
      Just: (pt) => parseInt(pt.value, 10),
      Nothing: () => {
        throw BRIDGE_ERROR.MISSING_POINT;
      }
    });
    //TODO why are we doing this locally, instead of made global on sign-in?
    this.address = this.props.wallet.matchWith({
      Just: (wal) => addressFromSecp256k1Public(wal.value.publicKey),
      Nothing: () => {
        throw BRIDGE_ERROR.MISSING_WALLET;
      }
    });
    this.contracts = this.props.contracts.matchWith({
      Just: cs => cs.value,
      Nothing: () => {
        throw BRIDGE_ERROR.MISSING_CONTRACTS;
      }
    });
    this.web3 = this.props.web3.matchWith({
      Just: w3 => w3.value,
      Nothing: () => {
        throw BRIDGE_ERROR.MISSING_WEB3;
      }
    });

    console.log(azimuth.delegatedSending);
    azimuth.delegatedSending.getTotalUsableInvites(this.contracts, this.point)
    .then(count => {
      this.setState({invitesAvailable: Just(count)});
    });
    this.findInvited();
  }

  componentDidUpdate(prevProps) {
    //
  }

  async findInvited() {
    let invited = await azimuth.delegatedSending.getInvited(
      this.contracts,
      this.point
    );
    invited = invited.map(async point => {
      const active = await azimuth.azimuth.isActive(this.contracts, point);
      const res = {point: Number(point), active:active};
      return res;
    });
    invited = await Promise.all(invited);
    const total = invited.length;
    const accepted = invited.filter(i => i.active).length;
    this.setState({invited: Just({total, accepted})});
  }

  async getTemporaryWallet() {
    const ticket = await wg.makeTicket(0x10000); // planet-sized ticket
    const owner = await wg.generateOwnershipWallet(0, ticket);
    return {ticket, owner: owner.keys.address};
  }

  async generateInvites() {
    this.setState({ status: STATUS.GENERATING });

    const web3 = this.web3;
    const targets = this.state.targets;
    console.log('getting planets');
    const planets = await azimuth.delegatedSending.getPlanetsToSend(
      this.contracts, this.point, targets.length
    );
    console.log('got planets', planets.length);
    if (planets.length < targets.length) {
      //TODO proper display state
      throw new Error('can currently only send '+planets.length+' invites...');
    }

    let invites = []; // { recipient, ticket, signedTx, rawTx }
    console.log('generating emails...');
    const nonce = await web3.eth.getTransactionCount(this.address);
    const chainId = await web3.eth.net.getId();
    console.log('chainId', chainId);
    for (let i = 0; i < targets.length; i++) {
      console.log('generating email', i, targets[i].email);
      this.setEmailStatus(i, EMAIL_STATUS.BUSY);

      const recipient = targets[i].email;
      const wallet = await this.getTemporaryWallet();

      let inviteTx = azimuth.delegatedSending.sendPoint(
        this.contracts, this.point, planets[i], wallet.owner
      );
      const signedTx = await signTransaction({
        ...this.props,
        txn: Just(inviteTx),
        gasPrice: GAS_PRICE_GWEI.toString(),
        gasLimit: GAS_LIMIT.toString(),
        nonce: nonce + i,
        chainId: chainId,
        setStx: () => {}
      });
      const rawTx = hexify(signedTx.serialize());

      invites.push({recipient, ticket: wallet.ticket, signedTx, rawTx });
      this.setEmailStatus(i, EMAIL_STATUS.DONE);
    }

    this.setState({ invites, status: STATUS.CAN_SEND });
  }

  async sendInvites() {
    const invites = this.state.invites;
    const web3 = this.web3;

    //TODO invite status isn't changing... why?
    this.setState({
      status: STATUS.FUNDING,
      invites: invites.map(i => { return {email: i.email, hasReceived: i.hasReceived, status: Nothing()}; })
    });

    const tankWasUsed = await tank.ensureFundsFor(
      web3, this.point, this.address,
      (INVITE_COST * invites.length),
      invites.map(i => i.rawTx), this.askForFunding
    );
    this.setState({ message: Nothing() }); //TODO see /lib/tank waitForBalance

    this.setState({ status: STATUS.SENDING });

    for (let i = 0; i < invites.length; i++) {
      const invite = invites[i];

      // send transaction, informing the user of failure
      const txHash = await sendSignedTransaction(
        web3, Just(invite.signedTx), tankWasUsed, ()=>{}
      ).catch(err => {
        console.error('invite tx sending failed', err);
        this.addError('Invite transaction not sent for ' + invite.recipient);
        this.setEmailStatus(i, EMAIL_STATUS.FAIL);
      });

      // ask the email sender to send this. we can do this prior to tx confirm,
      // because the sender service waits for confirm & success for us.
      const mailSuccess = await sendMail(
        invite.recipient, invite.ticket, invite.rawTx
      );
      //TODO but this doesn't catch sender-side failures... we may
      //     just need really good monitoring for that...
      if (mailSuccess) {
        this.setEmailStatus(i, EMAIL_STATUS.DONE);
      } else {
        console.log('email send failed');
        //NOTE this assumes that the transaction succeeds, but we don't know
        //     that for a fact yet...
        this.addError(
          'Invite email failed to send for ' + invite.recipient +
          '. Please give them this ticket: ' + invite.ticket
        );
        this.setEmailStatus(i, EMAIL_STATUS.FAIL);
      }

      // update status on transaction confirm, but don't block on it
      waitForTransactionConfirm(web3, txHash)
      .then(async success => {
        if (!success) {
          console.log('invite tx rejected');
          this.addError('Invite transaction failed for ' + invite.recipient);
          this.setEmailStatus(i, EMAIL_STATUS.FAIL);
        }
      });

    }

    this.setState({ status: STATUS.DONE });
  }

  setEmailStatus(i, status) {
    const targets = this.state.targets;
    targets[i].status = Just(status);
    this.setState({ targets });
  }

  addError(error) {
    const newError = this.state.errors.matchWith({
      Nothing: () => [error],
      Just: errs => errs.value.push(error)
    });
    this.setState({ errors: Just(newError) });
  }

  askForFunding(address, minBalance, balance) {
    this.setState({ message: Just(
      `Please make sure ${address} has at least ${minBalance} wei,` +
      `we'll continue once that's true. Current balance: ${balance}. Waiting...`
    ) });
  }

  handleEmailInput(i, email) {
    let targets = this.state.targets;
    targets[i].email = email;

    if (email.match(/.*@.*\...+/)) {
      hasReceived(email)
      .then(res => {
        targets[i].hasReceived = Just(res);
        this.setState({ targets });
      });
    } else {
      targets[i].hasReceived = Nothing();
    }
    this.setState({ targets });
  }

  canSend() {
    const targets = this.state.targets;
    // may not have duplicate targets
    if ((new Set(targets.map(t => t.email))).size !== targets.length)
      return false;
    for (let i = 0; i < targets.length; i++) {
      const target = targets[i];
      const res = target.hasReceived.matchWith({
        Nothing: () => true,
        Just: has => has.value
      });
      if (res) return false;
    }
    return this.state.invitesAvailable.matchWith({
      Nothing: () => false,
      Just: invites => (invites.value > 0)
    });
  }

  addTarget() {
    let targets = this.state.targets;
    targets.push({ email: '', hasReceived: Nothing(), status: Nothing() });
    this.setState({ targets });
  }

  removeTarget() {
    let targets = this.state.targets;
    targets.length = targets.length - 1;
    this.setState({ targets });
  }

  render() {
    const invitesAvailable = this.state.invitesAvailable.matchWith({
      Nothing: () => 'Loading...',
      Just: (invites) => {
        return `You currently have ${invites.value} invitations left.`;
      }
    });

    const invitesSent = this.state.invited.matchWith({
      Nothing: () => (<>{'Loading...'}</>),
      Just: (invited) => {
        return (<>
          {'Out of the '}
          {invited.value.total}
          {' invites you sent, '}
          {invited.value.accepted}
          {' have been accepted.'}
        </>);
      }
    });

    let error = this.state.errors.matchWith({
      Nothing: () => null,
      Just: (errors) => (<Warning className={'mt-8'}>
        <H3 style={{marginTop: 0, paddingTop: 0}}>
          { 'Something went wrong!' }
        </H3>
        { errors.value.map(err => (<p>{err}</p>)) }
      </Warning>)
    });

    //TODO don't render inputs at all if STATUS.DONE

    const inputDisabled = (this.state.status !== STATUS.INPUT);

    let targetInputs = [];
    for (let i = 0; i < this.state.targets.length; i++) {
      const target = this.state.targets[i];
      let progress = target.status.matchWith({
        Nothing: () => '',
        Just: status => status.value
      });
      targetInputs.push(<>
        <Input
          value={ target.email }
          onChange={ (value) => { this.handleEmailInput(i, value); } }
          placeholder={'Email address'}
          disabled={ inputDisabled }>
        </Input>
        {
          target.hasReceived.matchWith({
            Nothing: () => null,
            Just: (has) => has.value ? <span>{'×'}</span> : <span>{'°'}</span>
          })
        }
        { progress }
      </>);
    }

    return (
      <Row>
        <Col>

          <p>{ 'send invites here, for planets' }</p>

          <p>{ invitesAvailable }</p>

          <ul>{ invitesSent }</ul>

          { error }

          <Button
            prop-size={'s narrow'}
            className={'mt-8'}
            disabled={inputDisabled || this.state.targets.length === 1}
            onClick={this.removeTarget}
          >
            { '-' }
          </Button>

          <Button
            prop-size={'s narrow'}
            className={'mt-8'}
            disabled={
              inputDisabled ||
              this.state.invitesAvailable.matchWith({
                Nothing: () => true,
                Just: (inv) => (inv.value <= this.state.targets.length)
              })
            }
            onClick={this.addTarget}
          >
            { '+' }
          </Button>

          { targetInputs }

          <Button
            prop-size={'xl wide'}
            className={'mt-8'}
            disabled={ (inputDisabled && (this.state.status !== STATUS.CAN_SEND))
                       || !this.canSend() }
            onClick={ () => {
              if (this.state.status === STATUS.INPUT)
                this.generateInvites();
              if (this.state.status === STATUS.CAN_SEND)
                this.sendInvites();
            }}
          >
            { this.state.status }
          </Button>

        </Col>
      </Row>
    )
  }
}

export default InvitesSend
