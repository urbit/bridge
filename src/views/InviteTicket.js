import { Just, Nothing } from 'folktale/maybe';
import React from 'react';
import * as azimuth from 'azimuth-js';
import * as need from 'lib/need';

import View from 'components/View';

import {
  InnerLabel,
  Warning,
  TicketInput,
  VerifyTicketInput,
  Button,
  Passport,
} from '../components/old/Base';

import { randomPatq, compose } from '../lib/lib';
import { ROUTE_NAMES } from '../lib/routeNames';
import { withHistory } from '../store/history';
import {
  DEFAULT_HD_PATH,
  ownershipWalletFromTicket,
  walletFromMnemonic,
} from '../lib/wallet';
import { BRIDGE_ERROR } from '../lib/error';
import {
  INVITE_STAGES,
  WALLET_STATES,
  TRANSACTION_STATES,
} from '../lib/invite';
import { generateWallet, claimPointFromInvite } from '../lib/invite';
import { withNetwork } from '../store/network';
import { withWallet } from '../store/wallet';
import { Grid } from 'indigo-react';

class InviteTicket extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      inviteTicket: '',
      inviteWallet: Nothing(),
      verifyTicket: '',
      realTicket: '',
      realPoint: Nothing(),
      realWallet: Nothing(),
      walletReady: false,
      walletStates: [],
      errors: [],
      stage: INVITE_STAGES.INVITE_LOGIN,
      transactionProgress: TRANSACTION_STATES.GENERATING,
    };

    this.pointPlaceholder = randomPatq(4);
    this.ticketPlaceholder = randomPatq(12);

    this.handleInviteTicketInput = this.handleInviteTicketInput.bind(this);
    this.handleVerifyTicketInput = this.handleVerifyTicketInput.bind(this);
    this.updateProgress = this.updateProgress.bind(this);
    this.pushWalletState = this.pushWalletState.bind(this);
    this.navigateLogin = this.navigateLogin.bind(this);
  }

  pushWalletState(walletState) {
    this.setState({
      walletStates: this.state.walletStates.concat(walletState),
    });
  }

  navigateLogin() {
    this.props.history.popAndPush(ROUTE_NAMES.LOGIN);
  }

  handleInviteTicketInput(inviteTicket) {
    this.setState({ inviteTicket });
  }

  handleVerifyTicketInput(verifyTicket) {
    this.setState({ verifyTicket });
  }

  updateTransactionProgress(transactionProgress) {
    this.setState({ transactionProgress });
  }

  async unlockInviteWallet(inviteTicket) {
    this.setState({
      walletStates: this.state.walletStates.concat(WALLET_STATES.UNLOCKING),
      stage: INVITE_STAGES.INVITE_WALLET,
    });

    //NOTE ~zod because tmp wallet
    const ownership = await ownershipWalletFromTicket(inviteTicket, 0);
    const mnemonic = ownership.seed;
    //TODO isn't all this accessible in the ownership object?
    const inviteWallet = walletFromMnemonic(
      mnemonic,
      DEFAULT_HD_PATH
    ).matchWith({
      Just: w => w.value,
      Nothing: () => {
        throw BRIDGE_ERROR.MISSING_WALLET;
      },
    });

    const addr = inviteWallet.address;

    const contracts = need.contracts(this.props.contracts);

    const incoming = await azimuth.azimuth.getTransferringFor(contracts, addr);

    this.setState({
      walletStates: this.state.walletStates.concat(WALLET_STATES.GENERATING),
    });

    let realPoint = Nothing();
    let realWallet = Nothing();
    let errors = [];

    if (incoming.length > 0) {
      let pointNum = parseInt(incoming[0], 10);
      realPoint = Just(pointNum);

      this.setState({
        realPoint,
      });

      let genWallet = await generateWallet(pointNum);

      realWallet = Just(genWallet);
      if (incoming.length > 1) {
        //TODO  notify user "...and others / ticket reusable"
      }
    } else {
      errors = [
        'Invite code has no claimable ship. Check your invite code and try again.',
      ];
    }

    this.setState({
      realWallet,
      inviteWallet: Just(inviteWallet),
      // dev mode: uncomment this out to autofill verified ticket
      verifyTicket: !Nothing.hasInstance(realWallet)
        ? realWallet.value.ticket
        : '',
      walletStates: this.state.walletStates.concat(WALLET_STATES.RENDERING),
      errors,
    });
  }

  getTicketElement() {
    const phTick = this.ticketPlaceholder;

    let isLogin = this.state.stage === INVITE_STAGES.INVITE_LOGIN;
    let isVerify = this.state.stage === INVITE_STAGES.INVITE_VERIFY;

    if (isLogin || isVerify) {
      let value = isLogin ? this.state.inviteTicket : this.state.verifyTicket;
      let handler = isLogin
        ? this.handleInviteTicketInput
        : this.handleVerifyTicketInput;
      let label = isLogin ? 'Activation code' : 'ticket';

      // if realWallet is Just, then VerifyTicketInput appropriate contents; if Nothing, remain Nothing
      const Verified = this.state.realWallet.map(realWallet =>
        VerifyTicketInput(realWallet.ticket)
      );

      // Verified.getOrElse(TicketInput) falls back to TicketInput if Verified is Nothing
      const TicketElem = isVerify
        ? Verified.getOrElse(TicketInput)
        : TicketInput;

      return (
        <TicketElem
          className="mono mt-8"
          prop-size="md"
          prop-format="innerLabel"
          type="text"
          autoFocus
          name="invite"
          placeholder={`e.g. ${phTick}`}
          value={value}
          onChange={handler}>
          <InnerLabel>{label}</InnerLabel>
        </TicketElem>
      );
    } else {
      return null;
    }
  }

  getStageText() {
    const { stage } = this.state;

    let progressWidth = this.state.transactionProgress.pct;

    const stageText =
      stage === INVITE_STAGES.INVITE_LOGIN ? (
        <h1 className="text-700 mt-15">Welcome</h1>
      ) : stage === INVITE_STAGES.INVITE_WALLET ? (
        <div>
          <h1 className="fs-6 lh-8 mb-3">Passport</h1>
          <p>
            A passport is your digital identity. You will use your passport to
            access your true computer, send payments, and administer your
            identity. So naturally, you must keep this secure.
          </p>
          <p>
            After you’ve downloaded your passport, back up the ticket manually
            or store on a trusted device.
          </p>
        </div>
      ) : stage === INVITE_STAGES.INVITE_VERIFY ? (
        <div>
          <h1 className="fs-6 lh-8 mb-3">Verify Passport</h1>
          <p>
            Afer you download your passport, verify your custody. Your passport
            should be a folder of image files. One of them is your Master
            Ticket. Open it and enter the 4 word phrase below (with hyphens).
          </p>
        </div>
      ) : INVITE_STAGES.INVITE_TRANSACTIONS ? (
        this.state.transactionProgress.label ===
        TRANSACTION_STATES.DONE.label ? (
          <div>
            <h1 className="fs-6 lh-8 mb-3">
              <span>Success</span>
              <span className="ml-4 green">✓</span>
            </h1>
            <p>Transferring to Bridge...</p>
          </div>
        ) : (
          <div>
            <h1 className="fs-6 lh-8 mb-3">Submitting</h1>
            <p className="mt-4 mb-4">
              This step can take up to five minutes. Please do not leave this
              page until the transactions are complete.
            </p>
            <div className="passport-progress mb-2">
              <div
                className="passport-progress-filled"
                style={{ width: progressWidth }}
              />
            </div>
            <div className="flex justify-between">
              <div className="text-mono text-sm lh-6 green-dark">
                {this.state.transactionProgress.label}
              </div>
            </div>
          </div>
        )
      ) : null;

    return stageText;
  }

  updateProgress(notification) {
    let newState =
      notification.type === 'progress'
        ? { transactionProgress: notification.value }
        : notification.type === 'notify'
        ? { errors: [notification.value] }
        : {};

    this.setState(newState);
  }

  getContinueButton() {
    const {
      realPoint,
      realWallet,
      inviteWallet,
      stage,
      walletStates,
      verifyTicket,
      inviteTicket,
    } = this.state;
    const { web3, contracts, setUrbitWallet } = this.props;

    const btnColor = this.state.walletStates.includes(WALLET_STATES.PAPER_READY)
      ? 'green'
      : 'black';

    const clickHandler =
      stage === INVITE_STAGES.INVITE_LOGIN
        ? () => {
            this.unlockInviteWallet(inviteTicket);
          }
        : stage === INVITE_STAGES.INVITE_WALLET
        ? () => {
            this.setState({
              stage: INVITE_STAGES.INVITE_VERIFY,
            });
          }
        : stage === INVITE_STAGES.INVITE_VERIFY
        ? () => {
            this.setState({
              stage: INVITE_STAGES.INVITE_TRANSACTIONS,
              walletStates: this.state.walletStates.concat(
                WALLET_STATES.TRANSACTIONS
              ),
            });

            claimPointFromInvite({
              inviteWalletM: inviteWallet,
              realWalletM: realWallet,
              realPointM: realPoint,
              realTicket: verifyTicket,
              web3,
              contracts,
              setUrbitWallet,
              updateProgress: this.updateProgress,
            }).then(() => {
              setTimeout(() => {
                this.props.history.pop();
              }, 5000);
            });
          }
        : null;

    const ticketMatches = this.state.realWallet.matchWith({
      Just: wal => wal.value.ticket === this.state.verifyTicket,
      Nothing: () => false,
    });

    const continueReady =
      stage === INVITE_STAGES.INVITE_WALLET
        ? walletStates.includes(WALLET_STATES.DOWNLOADED)
        : stage === INVITE_STAGES.INVITE_VERIFY
        ? ticketMatches
        : true;

    const buttonElem =
      stage === INVITE_STAGES.INVITE_TRANSACTIONS ? null : (
        <Button
          className={'mt-4'}
          prop-size={'lg'}
          prop-color={btnColor}
          disabled={!continueReady}
          onClick={clickHandler}>
          {'Continue →'}
        </Button>
      );

    return buttonElem;
  }

  getStageDisplay() {
    const { stage } = this.state;

    if (stage === INVITE_STAGES.INVITE_LOGIN) return null;

    return (
      <div className="mt-6 mb-8">
        <span
          className={`fs-35 mr-3 ${stage !== INVITE_STAGES.INVITE_WALLET &&
            'gray-20'}`}>
          1 Passport
        </span>
        <span
          className={`fs-35 mr-3 ${stage !== INVITE_STAGES.INVITE_VERIFY &&
            'gray-20'}`}>
          2 Verify
        </span>
        <span
          className={`fs-35 mr-3 ${stage !==
            INVITE_STAGES.INVITE_TRANSACTIONS && 'gray-20'}`}>
          3 Invite
        </span>
      </div>
    );
  }

  getErrors() {
    if (this.state.errors.length === 0) return null;

    let errorElems = this.state.errors.map(e => <span>{e}</span>);

    return (
      <Warning>
        <h3 className={'mb-2'}>{'Warning'}</h3>
        {errorElems}
      </Warning>
    );
  }

  render() {
    let stageDisplay = this.getStageDisplay();
    let stageText = this.getStageText();
    let ticketElem = this.getTicketElement();
    let continueButton = this.getContinueButton();
    let errorDisplay = this.getErrors();

    return (
      <View.Full>
        <Grid>
          <Grid.Item half={1}>
            {stageDisplay}
            {errorDisplay}
            {stageText}
            {ticketElem}
            {continueButton}

            {this.state.stage === INVITE_STAGES.INVITE_LOGIN && (
              <Button
                prop-type={`link`}
                prop-size={`sm`}
                className={`block mt-4`}
                onClick={this.navigateLogin}>
                {`Log in`}
              </Button>
            )}
          </Grid.Item>
          <Grid.Item half={2}>
            <Passport
              point={this.state.realPoint}
              wallet={this.state.realWallet}
              walletStates={this.state.walletStates}
              pushWalletState={this.pushWalletState}
            />
          </Grid.Item>
        </Grid>
      </View.Full>
    );
  }
}

export default compose(
  withNetwork,
  withHistory,
  withWallet
)(InviteTicket);
