import { Just, Nothing } from 'folktale/maybe'
import React from 'react'
import { InnerLabel, ValidatedSigil, PointInput, Warning, Input, TicketInput,
  VerifyTicketInput, Button, Row, Col, H1, P, Passport } from '../components/Base'
import * as kg from '../../../node_modules/urbit-key-generation/dist/index'
import * as ob from 'urbit-ob'
import * as azimuth from 'azimuth-js'

import { simpleValidatorWrapper } from '../lib/validators'
import { ROUTE_NAMES } from '../lib/router'
import { DEFAULT_HD_PATH, urbitWalletFromTicket,
  walletFromMnemonic, addressFromSecp256k1Public } from '../lib/wallet'
import { BRIDGE_ERROR } from '../lib/error'
import { INVITE_STAGES, WALLET_STATES, TRANSACTION_STATES } from '../lib/invite'
import { generateWallet, startTransactions } from '../lib/invite'

const placeholder = (len) => {
  let bytes = window.crypto.getRandomValues(new Uint8Array(len))
  let hex = bytes.reduce((acc, byt) =>
    acc + byt.toString(16).padStart(2, '0'),
    ''
  )
  return ob.hex2patq(hex)
}

class InviteTicket extends React.Component {

  constructor(props) {
    super(props)

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
      transactionProgress: TRANSACTION_STATES.GENERATING
    }

    this.pointPlaceholder = placeholder(4)
    this.ticketPlaceholder = placeholder(12)

    this.handleInviteTicketInput = this.handleInviteTicketInput.bind(this)
    this.handleVerifyTicketInput = this.handleVerifyTicketInput.bind(this)
    this.updateProgress = this.updateProgress.bind(this)
    this.pushWalletState = this.pushWalletState.bind(this)
    this.navigateLogin = this.navigateLogin.bind(this)
  }

  pushWalletState(walletState) {
    this.setState({
      walletStates: this.state.walletStates.concat(walletState)
    })
  }

  navigateLogin() {
    this.props.popRoute()
    this.props.pushRoute(ROUTE_NAMES.NETWORK)
  }

  handleInviteTicketInput(inviteTicket) {
    this.setState({ inviteTicket })
  }

  handleVerifyTicketInput(verifyTicket) {
    this.setState({ verifyTicket })
  }

  updateTransactionProgress(transactionProgress) {
    this.setState({ transactionProgress })
  }

  async unlockInviteWallet(inviteTicket) {
    this.setState({
      walletStates: this.state.walletStates.concat(WALLET_STATES.UNLOCKING),
      stage: INVITE_STAGES.INVITE_WALLET
    });

    const uhdw = await urbitWalletFromTicket(inviteTicket, '~zod');
    const mnemonic = uhdw.ownership.seed;
    const inviteWallet = walletFromMnemonic(
      mnemonic,
      DEFAULT_HD_PATH,
      uhdw.meta.passphrase
    ).matchWith({
      Just: w => w.value,
      Nothing: () => null
    });

    const addr = addressFromSecp256k1Public(inviteWallet.publicKey);

    const ctrcs = this.props.contracts.matchWith({
      Just: ctrcs => ctrcs.value,
      Nothing: () => {
        throw BRIDGE_ERROR.MISSING_CONTRACTS
      }
    })

    const incoming = await azimuth.azimuth.getTransferringFor(ctrcs, addr)

    this.setState({
      walletStates: this.state.walletStates.concat(WALLET_STATES.GENERATING)
    })

    let realPoint = Nothing()
    let realWallet = Nothing()
    let errors = []

    if (incoming.length > 0) {
      let pointNum = parseInt(incoming[0]);
      realPoint = Just(pointNum);
      let genWallet = await generateWallet(pointNum);

      realWallet = Just(genWallet)
      if (incoming.length > 1) {
        //TODO  notify user "...and others / ticket reusable"
      }
    } else {
      errors = ["Invite code has no claimable ship. Check your invite code and try again."]
    }

    this.setState({
      realPoint,
      realWallet,
      inviteWallet: Just(inviteWallet),
      // verifyTicket: realWallet.value.ticket,
      walletStates: this.state.walletStates.concat(WALLET_STATES.RENDERING),
      errors
    })
  }

  getTicketElement() {
    const phTick = this.ticketPlaceholder

    let isLogin = this.state.stage === INVITE_STAGES.INVITE_LOGIN
    let isVerify = this.state.stage === INVITE_STAGES.INVITE_VERIFY

    if (isLogin || isVerify) {

      let value = isLogin ? this.state.inviteTicket : this.state.verifyTicket
      let handler = isLogin ? this.handleInviteTicketInput : this.handleVerifyTicketInput
      let label = isLogin ? 'Activation code' : 'ticket'

      const TicketElem =
          isVerify && !Nothing.hasInstance(this.state.realWallet)
        ? VerifyTicketInput(this.state.realWallet.value.ticket)
        : TicketInput

      return (
        <TicketElem
          className='mono mt-8'
          prop-size='md'
          prop-format='innerLabel'
          type='text'
          autoFocus
          name='invite'
          placeholder={ `e.g. ${phTick}` }
          value={ value }
          onChange={ handler }>
          <InnerLabel>{ label }</InnerLabel>
        </TicketElem>
      )
    } else {
      return null
    }
  }

  getStageText() {
    switch (this.state.stage) {
      case INVITE_STAGES.INVITE_LOGIN:
        return (
          <h1 className="text-700 mt-15">Welcome</h1>
        )
        break
      case INVITE_STAGES.INVITE_WALLET:
        return (
          <div>
            <h1 className="fs-6 lh-8 mb-3">Passport</h1>
            <p>A passport is your digital identity. You will use your passport to access your true computer, send payments, and administer your identity. So naturally, you must keep this secure.</p>
            <p>After you’ve downloaded your passport, back up the ticket manually or store on a trusted device.</p>
          </div>
        )
        break
      case INVITE_STAGES.INVITE_VERIFY:
        return (
          <div>
            <h1 className="fs-6 lh-8 mb-3">Verify Passport</h1>
            <p>Afer you download your passport, verify your custody. Your passport should be a folder of image files. One of them is your Master Ticket. Open it and enter the 4 word phrase below (with hyphens).</p>
          </div>
        )
        break
      case INVITE_STAGES.INVITE_TRANSACTIONS:
        let progressWidth = this.state.transactionProgress.pct;

        if (this.state.transactionProgress.label === TRANSACTION_STATES.DONE.label) {
          return (
            <div>
              <h1 className="fs-6 lh-8 mb-3">
                <span>Success</span>
                <span className="ml-4 green">✓</span>
              </h1>
              <p>Transferring to Bridge...</p>
            </div>
          )
        } else {
          return (
            <div>
              <h1 className="fs-6 lh-8 mb-3">Submitting</h1>
              <p className="mt-4 mb-4">This step can take up to five minutes. Please do not leave this page until the transactions are complete.</p>
              <div className="passport-progress mb-2">
                <div className="passport-progress-filled" style={{width: progressWidth}}></div>
              </div>
              <div className="flex justify-between">
                <div className="text-mono text-sm lh-6 green-dark">{this.state.transactionProgress.label}</div>
              </div>
            </div>
          )
        }
        break
    }
  }

  updateProgress(transactionProgress) {
    this.setState({
      transactionProgress
    })
  }

  getContinueButton() {
    if (this.state.stage === INVITE_STAGES.INVITE_TRANSACTIONS) return null

    const { realPoint, realWallet, inviteWallet, verifyTicket, inviteTicket } = this.state
    const { web3, contracts, setUrbitWallet } = this.props

    let clickHandler
    let btnColor = this.state.walletStates.includes(WALLET_STATES.PAPER_READY)
      ? 'green'
      : 'black'
    let continueReady

    switch(this.state.stage) {
      case INVITE_STAGES.INVITE_LOGIN:
        clickHandler = () => {
          this.unlockInviteWallet(inviteTicket)
        }
        continueReady = true
        break
      case INVITE_STAGES.INVITE_WALLET:
        clickHandler = () => {
          this.setState({
            stage: INVITE_STAGES.INVITE_VERIFY
          })
        }
        continueReady = this.state.walletStates.includes(WALLET_STATES.DOWNLOADED)
        break
      case INVITE_STAGES.INVITE_VERIFY:
        clickHandler = () => {
          const realTicket = realWallet.matchWith({
            Just: w => w.value.ticket,
            Nothing: null
          })

          this.setState({
            stage: INVITE_STAGES.INVITE_TRANSACTIONS,
            walletStates: this.state.walletStates.concat(WALLET_STATES.TRANSACTIONS)
          })

          startTransactions({
            inviteWalletM: inviteWallet,
            realWalletM: realWallet,
            realPointM: realPoint,
            realTicket: verifyTicket,
            web3M: web3,
            contractsM: contracts,
            setUrbitWallet,
            updateProgress: this.updateProgress
          })
          .then(() => {
            setTimeout(() => {
              this.props.popRoute()
            }, 5000)
          })
        }
        continueReady = true
        break
    }

    return (
      <Button
        className={'mt-4'}
        prop-size={'lg'}
        prop-color={btnColor}
        disabled={!continueReady}
        onClick={clickHandler}
      >
        { 'Continue →' }
      </Button>
    )
  }

  getStageDisplay() {
    const { stage } = this.state

    if (stage === INVITE_STAGES.INVITE_LOGIN) return null

    return (
      <div className="mt-6 mb-8">
        <span className={`fs-35 mr-3 ${stage !== INVITE_STAGES.INVITE_WALLET && 'gray-20'}`}>1 Passport</span>
        <span className={`fs-35 mr-3 ${stage !== INVITE_STAGES.INVITE_VERIFY && 'gray-20'}`}>2 Verify</span>
        <span className={`fs-35 mr-3 ${stage !== INVITE_STAGES.INVITE_TRANSACTIONS && 'gray-20'}`}>3 Invite</span>
      </div>
    )
  }

  getErrors() {
    if (this.state.errors.length === 0) return null

    let errorElems = this.state.errors.map(e => <span>{e}</span>)

    return (
      <Warning>
        <h3 className={'mb-2'}>{'Warning'}</h3>
        { errorElems }
      </Warning>
    )
  }

  render() {
    const { wallet } = this.props
    const { inviteTicket } = this.state

    let stageDisplay = this.getStageDisplay()
    let stageText = this.getStageText()
    let ticketElem = this.getTicketElement()
    let continueButton = this.getContinueButton()
    let errorDisplay = this.getErrors()

    return (
      <Row>
        <Col className="col-md-4 mt-">
          {stageDisplay}
          {errorDisplay}
          {stageText}
          {ticketElem}
          {continueButton}

          { this.state.stage === INVITE_STAGES.INVITE_LOGIN &&
            <Button
              prop-type={`link`}
              prop-size={`sm`}
              className={`block mt-4`}
              onClick={this.navigateLogin} >
              {`Log in`}
            </Button>
          }

        </Col>
        <Col className="col-md-offset-3 col-md-5 mt-18">
          <Passport
            point={this.state.realPoint}
            wallet={this.state.realWallet}
            walletStates={this.state.walletStates}
            pushWalletState={this.pushWalletState}
          />
        </Col>
      </Row>
    )
  }
}

export default InviteTicket
