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

class InviteVerify extends React.Component {

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

  askForFunding(address, amount, current) {
    this.updateProgress(`Please make sure ${address} has at least ${amount} wei, we'll continue once that's true. Current balance: ${current}. Waiting`);
  }

  async startTransactions() {
    const { point } = this.state;

    if (Nothing.hasInstance(this.props.web3)) {
      throw BRIDGE_ERROR.MISSING_WEB3;
    }
    const web3 = this.props.web3.value;

    if (Nothing.hasInstance(this.props.contracts)) {
      throw BRIDGE_ERROR.MISSING_CONTRACTS;
    }
    const contracts = this.props.contracts.value;

    if (Nothing.hasInstance(this.props.wallet)) {
      throw BRIDGE_ERROR.MISSING_WALLET;
    }
    const inviteWallet = this.props.wallet.value;
    const inviteAddress = addressFromSecp256k1Public(inviteWallet.publicKey);
    console.log('working as', inviteAddress);

    let newUrbitWallet = await urbitWalletFromTicket(this.state.ticket, point);

    // transfer from invite wallet to new wallet

    let transferTx = azimuth.ecliptic.transferPoint(contracts, point, newUrbitWallet.ownership.keys.address);
    transferTx.gas = 500000; //TODO can maybe be lower?

    // ping gas tank with txs if needed

    let inviteNonce = await web3.eth.getTransactionCount(inviteAddress);
    transferTx.nonce = inviteNonce++;
    transferTx.gasPrice = 20000000000; //NOTE we pay the premium for faster ux
    transferTx.from = inviteAddress;

    //NOTE using web3.eth.accounts.signTransaction is broken (1.0.0-beta51)
    let transferStx = new Tx(transferTx);
    transferStx.sign(inviteWallet.privateKey);
    let rawTransferStx = '0x'+transferStx.serialize().toString('hex');

    const transferCost = transferTx.gas * transferTx.gasPrice;
    await this.ensureFundsFor(web3, point, inviteAddress, transferCost, [rawTransferStx]);

    // send transaction
    this.updateProgress(PROGRESS_STATES.CLAIMING);
    await this.sendAndAwaitConfirm(web3, [rawTransferStx]);

    //
    // we're gonna be operating as the new wallet from here on out, so change
    // the relevant values
    //
    this.props.setUrbitWallet(Just(newUrbitWallet));
    const newAddress = newUrbitWallet.ownership.keys.address;

    // configure management proxy

    let managementTx = azimuth.ecliptic.setManagementProxy(contracts, point, newUrbitWallet.management.keys.address);
    managementTx.gas = 200000;
    managementTx.nonce = 0;

    // configure networking public keys
    //TODO feels like more of this logic should live in a lib?
    let networkSeed = await attemptSeedDerivation(true, {
      walletType: WALLET_NAMES.TICKET,
      urbitWallet: Just(newUrbitWallet),
      pointCursor: Just(point),
      pointCache: {[point]: {keyRevisionNumber: 0}}
    });
    if (Nothing.hasInstance(networkSeed)) {
      throw new Error('wtf network seed not derived');
    }
    networkSeed = networkSeed.value;
    const networkKeys = kg.deriveNetworkKeys(networkSeed);

    let keysTx = azimuth.ecliptic.configureKeys(
      contracts,
      point,
      addHexPrefix(networkKeys.crypt.public),
      addHexPrefix(networkKeys.auth.public),
      1,
      false
    );
    keysTx.gas = 150000;
    keysTx.nonce = 1;

    //TODO  refactor this process into function
    let totalCost = 0;
    let txs = [managementTx, keysTx];
    txs = txs.map(tx => {
      tx.gasPrice = 20000000000;
      tx.from = newAddress;
      totalCost = totalCost + (tx.gasPrice * tx.gas);
      return tx;
    });

    let rawStxs = txs.map(tx => {
      let stx = new Tx(tx);
      stx.sign(Buffer.from(newUrbitWallet.ownership.keys.private, 'hex'));
      return '0x'+stx.serialize().toString('hex');
    });

    await this.ensureFundsFor(web3, point, newAddress, totalCost, rawStxs);

    this.updateProgress(PROGRESS_STATES.CONFIGURING);
    await this.sendAndAwaitConfirm(web3, rawStxs);

    // if non-trivial eth left in invite wallet, transfer to new ownership
    this.updateProgress(PROGRESS_STATES.CLEANING);
    let balance = await web3.eth.getBalance(inviteAddress);
    const gasPrice = 20000000000;
    const gasLimit = 21000;
    const sendEthCost = gasPrice * gasLimit;
    if (balance > sendEthCost) {
      const value = (balance - sendEthCost);
      console.log('sending', value);
      const tx = {
        to: newAddress,
        value: value,
        gasPrice: gasPrice,
        gas: gasLimit,
        nonce: inviteNonce++
      }
      let stx = new Tx(tx);
      stx.sign(inviteWallet.privateKey);
      const rawTx = '0x'+stx.serialize().toString('hex');
      await web3.eth.sendSignedTransaction(rawTx).catch(err => {
        console.log('error sending value tx, who cares', err);
      });
      console.log('sent old balance');
    }

    // proceed without waiting for confirm
    this.updateProgress(PROGRESS_STATES.DONE);
    this.props.setUrbitWallet(Just(newUrbitWallet));
    //TODO forward to "all done!" screen
  }

  async ensureFundsFor(web3, point, address, cost, signedTxs) {
    this.updateProgress(PROGRESS_STATES.FUNDING);
    let balance = await web3.eth.getBalance(address);

    if (cost > balance) {

      const fundsRemaining = await tank.remainingTransactions(point);
      if (fundsRemaining < signedTxs.length) {
        throw new Error(`TODO present user with "please fund $(address) with at least $(cost), then click to retry"`);
      }

      const res = await tank.fundTransactions(signedTxs);
      if (!res.success) {
        //TODO show pls fund msg
        console.log('tank request failed');
      } else {
        await waitForTransactionConfirm(web3, res.txHash);
        let newBalance = await web3.eth.getBalance(address);
        console.log('funds have confirmed', balance >= cost, balance, newBalance);
      }

    } else {
      console.log('already have sufficient funds');
    }
  }

  async sendAndAwaitConfirm(web3, signedTxs) {
    let promises = signedTxs.map(tx => {
      console.log('sending...');
      return new Promise((resolve, reject) => {
        web3.eth.sendSignedTransaction(tx).then(res => {
          //TODO figure out how to handle the doesn't-resolve-immediately case
          //res.transactionHash;
          resolve();
        }).catch(async err => {
          // if there's an error, check if it's because the transaction was
          // already confirmed prior to sending.
          // this is really only the case in local dev environments.
          const txHash = web3.utils.keccak256(tx);
          const confirmed = await isTransactionConfirmed(web3, txHash);
          if (confirmed) resolve();
          else reject(err);
        });
      });
    });
  }

  //TODO waitForBalance(address, minBalance)

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

export default InviteVerify
