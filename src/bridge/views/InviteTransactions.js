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
import { signTransaction, sendSignedTransaction } from '../lib/txn'
import { attemptSeedDerivation, genKey  } from '../lib/keys'
import * as kg from '../../../node_modules/urbit-key-generation/dist/index'
import * as tank from '../lib/tank'
import Tx from 'ethereumjs-tx'

const PROGRESS_STATES = {
  GENERATING: 'Generating transactions',
  SIGNING: 'Signing transactions',
  FUNDING: 'Funding transactions',
  SENDING: 'Sending transactions',
  WAITING: 'Waiting for transaction confirmations',
  CLEANING: 'Cleaning up'
}

class InviteVerify extends React.Component {

  constructor(props) {
    super(props)

    this.state = {
      point: this.props.routeData.point,
      ticket: this.props.routeData.ticket
    }
  }

  componentDidMount() {
    this.startTransactions();
  }

  componentDidUpdate(prevProps) {
    //
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

    let nonce = await web3.eth.getTransactionCount(inviteAddress);
    transferTx.nonce = nonce++;
    transferTx.gasPrice = 20000000000; //NOTE we pay the premium for faster ux
    transferTx.from = inviteAddress;

    //NOTE using web3.eth.accounts.signTransaction is broken (1.0.0-beta51)
    let transferStx = new Tx(transferTx);
    transferStx.sign(inviteWallet.privateKey);
    let rawTransferStx = '0x'+transferStx.serialize().toString('hex');

    let transferCost = (transferTx.gasPrice * transferTx.gas);
    let balance = await web3.eth.getBalance(inviteAddress);
    console.log('balance', balance, 'transfercost', transferCost, 'need funds', transferCost > balance);
    if (transferCost > balance) {

      //TODO want to do this earlier, maybe? but we need costs for all
      //     transactions, and all balances, known before we can display useful
      //     prompts to the user.
      const fundsRemaining = await tank.remainingTransactions(point);
      console.log('freebies remaining', fundsRemaining);
      if (fundsRemaining < 1) {
        throw new Error(`TODO present user with "please fund $(inviteAddress) with $(transferCost), then click to retry"`);
      }

      const res = await this.pingGasTank([rawTransferStx]);
      if (!res) {
        //TODO show pls fund msg + try again button
        console.log('tank request failed');
      }

      //TODO await confirm of res.txHash
      console.log('funded transfer tx');
    } else {
      console.log('paying for ourselves');
    }

    // send transaction
    await web3.eth.sendSignedTransaction(rawTransferStx);

    const transferTxHash = web3.utils.keccak256(rawTransferStx);
    //TODO refactor into waitForConfirm function in /lib/txn
    let confirmed = false;
    let success = false;
    while (!confirmed) {
      let receipt = await web3.eth.getTransactionReceipt(transferTxHash);
      confirmed = (receipt !== null);
      if (confirmed) {
        console.log('confirmed!', receipt);
        success = receipt.status;
      }
    }

    if (!success) {
      throw new Error('transaction failed');
    }

    console.log('sent transfer tx');

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

    //TODO copy-pasted from above, refactor
    balance = await web3.eth.getBalance(newAddress);
    console.log('balance', balance, 'totalcost', totalCost, 'need funds', totalCost > balance);
    if (totalCost > balance) {

      const fundsRemaining = await tank.remainingTransactions(point);
      console.log('freebies remaining', fundsRemaining);
      if (fundsRemaining < 2) {
        throw new Error(`TODO present user with "please fund $(newAddress) with at least $(totalCost), then click to retry"`);
      }

      const res = await this.pingGasTank(rawStxs);
      if (!res) {
        //TODO show pls fund msg + try again button
        console.log('tank request failed');
      }

      //TODO await confirm of res.txHash
      console.log('funded transfer tx');
    } else {
      console.log('paying for ourselves');
    }

    await web3.eth.sendSignedTransaction(rawStxs[0]);
    await web3.eth.sendSignedTransaction(rawStxs[1]);
    console.log('sent transactions');
    //TODO use PromiEvent functions to wait for confirm

    // if non-trivial eth left in invite wallet, transfer to new ownership
    //TODO
    balance = await web3.eth.getBalance(inviteAddress);
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
        nonce: nonce++
      }
      let stx = new Tx(tx);
      stx.sign(inviteWallet.privateKey);
      const rawTx = '0x'+stx.serialize().toString('hex');
      await web3.eth.sendSignedTransaction(rawTx);
      console.log('sent old balance');
    }

    // proceed without waiting for confirm
    this.props.setUrbitWallet(Just(newUrbitWallet));
    //TODO forward to "all done!" screen
  }

  //TODO move into tank.js?
  async pingGasTank(signedTxs) {
    //TODO  use folktale/either folktale/result more
    const fundRes = await tank.fundTransactions(signedTxs);

    let success = false;

    if (fundRes.success === true) {
      //TODO await confirmation on fundRes.txHash
    } else {
      console.log(fundRes.reason);
    }

    return success;
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

    console.log('tickets', this.state.ticket, this.state.realTicket, (this.state.realTicket === this.state.ticket));
    return (
      <Row>
        <Col>

          { pointOverview }

          <p>{ 'Please wait while your wallet and point are prepared for use. This may take up to five minutes.' }</p>

        </Col>
      </Row>
    )
  }
}

export default InviteVerify
