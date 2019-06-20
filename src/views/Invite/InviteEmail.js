import { Just, Nothing } from 'folktale/maybe';
import React from 'react';
import * as azimuth from 'azimuth-js';
import * as need from 'lib/need';

import { hasReceived, sendMail } from 'lib/inviteMail';
import { Button, Input, H3, Warning } from 'components/old/Base';

// for wallet generation
import * as wg from '_walletgen/lib/lib';

// for transaction generation and signing
import {
  signTransaction,
  sendSignedTransaction,
  waitForTransactionConfirm,
  hexify,
  fromWei,
  toWei,
} from 'lib/txn';
import * as tank from 'lib/tank';
import { withNetwork } from 'store/network';
import { compose } from 'lib/lib';
import { withWallet } from 'store/wallet';
import { withPointCursor } from 'store/pointCursor';
import View from 'components/View';

const GAS_PRICE_GWEI = 20; // we pay the premium for faster ux
const GAS_LIMIT = 350000;
const INVITE_COST = toWei((GAS_PRICE_GWEI * GAS_LIMIT).toString(), 'gwei');

const STATUS = {
  INPUT: 'Generate invites',
  GENERATING: 'Generating invites',
  CAN_SEND: 'Send invites',
  FUNDING: 'Funding invites',
  SENDING: 'Sending invites',
  DONE: 'Done',
  FAIL: 'Some failed',
};

const EMAIL_STATUS = {
  BUSY: '⋯',
  DONE: '✔',
  FAIL: '×',
};

class InviteEmail extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      invitesAvailable: Nothing(),
      invited: Nothing(),
      targets: [{ email: '', hasReceived: Nothing(), status: Nothing() }],
      status: STATUS.INPUT,
      errors: Nothing(),
      //
      fundingMessage: Nothing(),
      wipInvites: [],
    };

    this.findInvited = this.findInvited.bind(this);
    this.generateInvites = this.generateInvites.bind(this);
    this.sendInvites = this.sendInvites.bind(this);
    this.canSend = this.canSend.bind(this);
    this.addError = this.addError.bind(this);
    this.handleEmailInput = this.handleEmailInput.bind(this);
    this.addTarget = this.addTarget.bind(this);
    this.removeTarget = this.removeTarget.bind(this);
    this.setEmailStatus = this.setEmailStatus.bind(this);
    this.askForFunding = this.askForFunding.bind(this);
  }

  componentDidMount() {
    this.point = need.pointCursor(this.props.pointCursor);
    this.address = need.addressFromWallet(this.props.wallet);
    this.contracts = need.contracts(this.props.contracts);
    this.web3 = need.web3(this.props.web3);

    console.log(azimuth.delegatedSending);
    azimuth.delegatedSending
      .getTotalUsableInvites(this.contracts, this.point)
      .then(count => {
        this.setState({ invitesAvailable: Just(count) });
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
      const res = { point: Number(point), active: active };
      return res;
    });
    invited = await Promise.all(invited);
    const total = invited.length;
    const accepted = invited.filter(i => i.active).length;
    this.setState({ invited: Just({ total, accepted }) });
  }

  async getTemporaryWallet() {
    const ticket = await wg.makeTicket(0x10000); // planet-sized ticket
    const owner = await wg.generateOwnershipWallet(0, ticket);
    return { ticket, owner: owner.keys.address };
  }

  async generateInvites() {
    this.setState({ status: STATUS.GENERATING });

    const web3 = this.web3;
    const targets = this.state.targets;
    const planets = await azimuth.delegatedSending.getPlanetsToSend(
      this.contracts,
      this.point,
      targets.length
    );

    // account for the race condition where invites got used up while we were
    // composing our target list
    if (planets.length < targets.length) {
      this.addError('Can currently only send ' + planets.length + ' invites!');
      return;
    }

    const nonce = await web3.eth.getTransactionCount(this.address);
    const chainId = await web3.eth.net.getId();

    // create invite wallets and transactions
    let invites = []; // { email, ticket, signedTx, rawTx }
    for (let i = 0; i < targets.length; i++) {
      console.log('generating email', i, targets[i].email);
      this.setEmailStatus(i, EMAIL_STATUS.BUSY);

      const email = targets[i].email;
      const wallet = await this.getTemporaryWallet();

      let inviteTx = azimuth.delegatedSending.sendPoint(
        this.contracts,
        this.point,
        planets[i],
        wallet.owner
      );
      const signedTx = await signTransaction({
        ...this.props,
        txn: Just(inviteTx),
        gasPrice: GAS_PRICE_GWEI.toString(),
        gasLimit: GAS_LIMIT.toString(),
        nonce: nonce + i,
        chainId: chainId,
        setStx: () => {},
      });
      const rawTx = hexify(signedTx.serialize());

      invites.push({ email, ticket: wallet.ticket, signedTx, rawTx });
      this.setEmailStatus(i, EMAIL_STATUS.DONE);
    }

    this.setState({ wipInvites: invites, status: STATUS.CAN_SEND });
  }

  async sendInvites() {
    const invites = this.state.wipInvites;
    const web3 = this.web3;

    //TODO invite status isn't changing/re-rendering... why?
    this.setState({
      status: STATUS.FUNDING,
      invites: invites.map(i => {
        return { ...i, status: Nothing() };
      }),
    });

    const tankWasUsed = await tank.ensureFundsFor(
      web3,
      this.point,
      this.address,
      INVITE_COST * invites.length,
      invites.map(i => i.rawTx),
      this.askForFunding,
      () => {
        this.setState({ fundingMessage: Nothing() });
      }
    );

    this.setState({ status: STATUS.SENDING });

    //TODO nasty loop, probably move into lib... but so many callbacks!
    let promises = [];
    for (let i = 0; i < invites.length; i++) {
      const invite = invites[i];

      // send transaction. if it fails, inform the user and skip to next
      let txHash;
      try {
        txHash = await sendSignedTransaction(
          web3,
          Just(invite.signedTx),
          tankWasUsed,
          () => {}
        );
      } catch (err) {
        console.error('invite tx sending failed', err);
        this.addError('Invite transaction not sent for ' + invite.email);
        this.setEmailStatus(i, EMAIL_STATUS.FAIL);
        continue;
      }

      // ask the email sender to send this. we can do this prior to tx confirm,
      // because the sender service waits for confirm & success for us.
      // if this fails, inform the user and skip to next
      try {
        const mailSuccess = await sendMail(
          invite.email,
          invite.ticket,
          invite.rawTx
        );
        if (!mailSuccess) throw new Error();
        this.setEmailStatus(i, EMAIL_STATUS.DONE);
      } catch (e) {
        console.log('email send failed');
        //NOTE this assumes that the transaction succeeds, but we don't know
        //     that for a fact yet...
        this.addError(
          'Invite email failed to send for ' +
            invite.email +
            '. Please give them this ticket: ' +
            invite.ticket
        );
        this.setEmailStatus(i, EMAIL_STATUS.FAIL);
        continue;
      }

      // update status on transaction confirm, but don't block on it
      promises.push(
        waitForTransactionConfirm(web3, txHash).then(success => {
          if (success) {
            this.setEmailStatus(i, EMAIL_STATUS.DONE);
          } else {
            console.log('invite tx rejected');
            this.addError('Invite transaction failed for ' + invite.email);
            this.setEmailStatus(i, EMAIL_STATUS.FAIL);
          }
          return success;
        })
      );
    }

    const txStatus = await Promise.all(promises);
    if (txStatus.every(e => e)) {
      this.setState({ status: STATUS.DONE });
    } else {
      this.setState({ status: STATUS.FAIL });
    }
  }

  setEmailStatus(i, status) {
    const targets = this.state.targets;
    targets[i].status = Just(status);
    this.setState({ targets });
  }

  addError(error) {
    const newError = this.state.errors.matchWith({
      Nothing: () => [error],
      Just: errs => {
        errs.value.push(error);
        return errs.value;
      },
    });
    this.setState({ errors: Just(newError) });
  }

  askForFunding(address, minBalance, balance) {
    this.setState({
      fundingMessage: Just(
        `Please make sure ${address} has at least ${fromWei(minBalance)} ETH,` +
          `we'll continue once that's true. Current balance: ${fromWei(
            balance
          )}.` +
          `Waiting...`
      ),
    });
  }

  handleEmailInput(i, email) {
    let targets = this.state.targets;
    targets[i].email = email;

    // if it's a valid address, check if it has received an invite before
    if (email.match(/.*@.*\...+/)) {
      hasReceived(email).then(res => {
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
    if (new Set(targets.map(t => t.email)).size !== targets.length)
      return false;

    // none may have received invites already
    for (let i = 0; i < targets.length; i++) {
      const target = targets[i];
      const res = target.hasReceived.matchWith({
        Nothing: () => true,
        Just: has => has.value,
      });
      if (res) return false;
    }

    return this.state.invitesAvailable.matchWith({
      Nothing: () => false,
      Just: invites => invites.value > 0,
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
    const dif =
      this.state.status === STATUS.DONE ? this.state.targets.length : null;

    const invitesAvailable = this.state.invitesAvailable.matchWith({
      Nothing: () => 'Loading...',
      Just: invites => {
        const dia = dif ? `(-${dif})` : '';
        return `You currently have ${invites.value}${dia} invitations left.`;
      },
    });

    const invitesSent = this.state.invited.matchWith({
      Nothing: () => <>{'Loading...'}</>,
      Just: invited => {
        const dit = dif ? `(+${dif})` : '';
        return (
          <>
            {'Out of the '}
            {invited.value.total + dit}
            {' invites you sent, '}
            {invited.value.accepted}
            {' have been accepted.'}
          </>
        );
      },
    });

    const error = this.state.errors.matchWith({
      Nothing: () => null,
      Just: errors => (
        <Warning className={'mt-8'}>
          <H3 style={{ marginTop: 0, paddingTop: 0 }}>
            {'Something went wrong!'}
          </H3>
          {errors.value.map(err => (
            <p>{err}</p>
          ))}
        </Warning>
      ),
    });

    const fundingMessage = this.state.fundingMessage.matchWith({
      Nothing: () => null,
      Just: msg => <Warning className={'mt-8'}>{msg.value}</Warning>,
    });

    let inputs;
    if (this.state.status === STATUS.DONE) {
      //TODO proper clickable router thing
      inputs = '<- Back to Home';
    } else {
      const inputDisabled = this.state.status !== STATUS.INPUT;

      const lessButton = (
        <Button
          prop-size={'s narrow'}
          className={'mt-8'}
          disabled={inputDisabled || this.state.targets.length === 1}
          onClick={this.removeTarget}>
          {'-'}
        </Button>
      );

      const moreButton = (
        <Button
          prop-size={'s narrow'}
          className={'mt-8'}
          disabled={
            inputDisabled ||
            this.state.invitesAvailable.matchWith({
              Nothing: () => true,
              Just: inv => inv.value <= this.state.targets.length,
            })
          }
          onClick={this.addTarget}>
          {'+'}
        </Button>
      );

      let targetInputs = [];
      for (let i = 0; i < this.state.targets.length; i++) {
        const target = this.state.targets[i];
        let progress = target.status.matchWith({
          Nothing: () => '',
          Just: status => status.value,
        });
        targetInputs.push(
          <>
            <Input
              value={target.email}
              onChange={value => {
                this.handleEmailInput(i, value);
              }}
              placeholder={'Email address'}
              disabled={inputDisabled}
            />
            {target.hasReceived.matchWith({
              Nothing: () => null,
              Just: has =>
                has.value ? <span>{'×'}</span> : <span>{'°'}</span>,
            })}
            {progress}
          </>
        );
      }

      const submitButton = (
        <Button
          prop-size={'xl wide'}
          className={'mt-8'}
          disabled={
            (inputDisabled && this.state.status !== STATUS.CAN_SEND) ||
            !this.canSend()
          }
          onClick={() => {
            if (this.state.status === STATUS.INPUT) this.generateInvites();
            if (this.state.status === STATUS.CAN_SEND) this.sendInvites();
          }}>
          {this.state.status}
        </Button>
      );

      inputs = (
        <>
          {lessButton}
          {moreButton}
          {targetInputs}
          {submitButton}
        </>
      );
    }

    return (
      <View>
        <p>{'send invites here, for planets'}</p>

        <p>{invitesAvailable}</p>

        <ul>{invitesSent}</ul>

        {error}

        {fundingMessage}

        {inputs}
      </View>
    );
  }
}

export default compose(
  withNetwork,
  withWallet,
  withPointCursor
)(InviteEmail);
