import { Just, Nothing } from 'folktale/maybe'
import React from 'react'
import { pour } from 'sigil-js'
import * as ob from 'urbit-ob'
import * as azimuth from 'azimuth-js'

import {
  EthereumWallet,
  addressFromSecp256k1Public,
  urbitWalletFromTicket,
  addHexPrefix,
  WALLET_NAMES
} from '../lib/wallet'

import ReactSVGComponents from '../components/ReactSVGComponents'
import KeysAndMetadata from './Point/KeysAndMetadata'
import Actions from './Point/Actions'
import { BRIDGE_ERROR } from '../lib/error'
import { Row, Col, Warning, Button, H1, H3 } from '../components/Base'

// for transaction generation and signing
import {
  signTransaction,
  sendSignedTransaction,
  waitForTransactionConfirm,
  isTransactionConfirmed
} from '../lib/txn'
import { attemptSeedDerivation, genKey  } from '../lib/keys'
import * as kg from '../../../node_modules/urbit-key-generation/dist/index'
import * as tank from '../lib/tank'
import Tx from 'ethereumjs-tx'

const PROGRESS_STATES = {
  GENERATING: 'Generating transactions',
  SIGNING: 'Signing transactions',
  FUNDING: 'Funding transactions',
  CLAIMING: 'Claiming invite',
  CONFIGURING: 'Configuring planet',
  CLEANING: 'Cleaning up',
  DONE: 'Done'
}

class InviteTransactions extends React.Component {

  constructor(props) {
    super(props)

    this.state = {
      point: this.props.routeData.point,
      ticket: this.props.routeData.ticket,
      progress: 'Starting'
    }

    this.startTransactions = this.startTransactions.bind(this);
  }

  componentDidMount() {
    //NOTE delayed so that we hang *after* rendering the page
    this.updateProgress('Generating transactions');
    setTimeout(this.startTransactions, 100);
  }

  componentDidUpdate(prevProps) {
    //
  }

  updateProgress(msg) {
    this.setState({progress: msg+'...'});
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

          <p>{ 'Please wait while your wallet and point are prepared for use. This may take up to five minutes.' }</p>

          <p>{ this.state.progress }</p>

        </Col>
      </Row>
    )
  }
}

export default InviteTransactions
