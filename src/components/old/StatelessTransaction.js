import { Nothing, Just } from 'folktale/maybe';
import { Ok } from 'folktale/result';
import React from 'react';
import * as need from '../../lib/need';

import { Code, H3 } from './Base';
import { Button } from './Base';
import { CheckboxButton, Input, InnerLabel, InnerLabelDropdown } from './Base';
import { Warning } from './Base';

import { BRIDGE_ERROR } from '../../lib/error';
import { ROUTE_NAMES } from '../../lib/routeNames';
import { compose } from '../../lib/lib';
import * as tank from '../../lib/tank';
import {
  sendSignedTransaction,
  fromWei,
  toWei,
  hexify,
  renderSignedTx,
  signTransaction,
} from '../../lib/txn';

import { withTxnConfirmations } from '../../store/txnConfirmations';
import { withNetwork } from '../../store/network';
import { withHistory } from '../../store/history';
import { withWallet } from '../../store/wallet';
import { withTxnCursor } from '../../store/txnCursor';

const SUBMISSION_STATES = {
  PROMPT: 'Send transaction',
  PREPARING: 'Preparing...',
  FUNDING: 'Finding transaction funding...',
  SENDING: 'Sending transaction...',
};

class StatelessTransaction extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      gasPrice: '5',
      gasLimit: '600000',
      showGasDetails: false,
      userApproval: false,
      chainId: '1',
      customChain: false,
      nonce: '0',
      stx: Nothing(),
      txn: Nothing(),
      txStatus: SUBMISSION_STATES.PROMPT,
      txError: Nothing(),
    };

    this.createUnsignedTxn = this.createUnsignedTxn.bind(this);
    this.setUserApproval = this.setUserApproval.bind(this);
    this.setTxn = this.setTxn.bind(this);
    this.setStx = this.setStx.bind(this);
    this.sendTxn = this.sendTxn.bind(this);
    this.setNonce = this.setNonce.bind(this);
    this.setChainId = this.setChainId.bind(this);
    this.setGasPrice = this.setGasPrice.bind(this);
    this.setGasLimit = this.setGasLimit.bind(this);
    this.rangeChange = this.rangeChange.bind(this);
    this.toggleGasDetails = this.toggleGasDetails.bind(this);
    this.handleChainUpdate = this.handleChainUpdate.bind(this);
  }

  componentDidMount() {
    const { props } = this;

    const addr = need.addressFromWallet(props.wallet);

    props.web3.matchWith({
      Nothing: () => {},
      Just: w3 => {
        const validWeb3 = w3.value;

        const getTxMetadata = [
          validWeb3.eth.getTransactionCount(addr),
          validWeb3.eth.net.getId(),
          validWeb3.eth.getGasPrice(),
        ];

        Promise.all(getTxMetadata).then(r => {
          const txMetadata = {
            nonce: r[0],
            chainId: r[1],
            gasPrice: fromWei(r[2], 'gwei'),
          };

          this.setState({ ...txMetadata });
        });
      },
    });
  }

  handleChainUpdate(chainId) {
    if (chainId === 'custom') {
      this.setState({
        customChain: true,
      });
    } else {
      this.setState({
        customChain: false,
        chainId,
      });
    }

    this.clearStx();
  }

  setUserApproval() {
    const { state } = this;
    this.setState({ userApproval: !state.userApproval });
  }

  toggleGasDetails() {
    this.setState({
      showGasDetails: !this.state.showGasDetails,
    });
  }

  setStx(stx) {
    this.setState({
      stx,
      userApproval: false,
    });
  }

  setTxn(txn) {
    this.setState({ txn });
  }

  createUnsignedTxn() {
    const txn = this.props.createUnsignedTxn();

    this.setState({ txn });
  }

  clearTxn() {
    this.setState({
      userApproval: false,
      txn: Nothing(),
      stx: Nothing(),
    });
  }

  setNonce(nonce) {
    this.setState({ nonce });
    this.clearStx();
  }

  setChainId(chainId) {
    this.setState({ chainId });
    this.clearStx();
  }

  setGasPrice(gasPrice) {
    this.setState({ gasPrice });
    this.clearStx();
  }

  rangeChange(e) {
    this.setGasPrice(e.target.value);
  }

  setGasLimit(gasLimit) {
    this.setState({ gasLimit });
    this.clearStx();
  }

  clearStx() {
    this.setState({
      userApproval: false,
      stx: Nothing(),
    });
  }

  async sendTxn() {
    const { props, state } = this;
    const web3 = props.web3.value;

    const stx = state.stx.matchWith({
      Just: tx => tx.value,
      Nothing: () => {
        throw BRIDGE_ERROR.MISSING_TXN;
      },
    });

    if (props.beforeSend) {
      try {
        this.setState({ txStatus: SUBMISSION_STATES.PREPARING });
        const res = await props.beforeSend(stx);
        if (res === false) throw new Error('beforeSend disallowed sending');
      } catch (e) {
        console.log('beforeSend error', e);
        this.setState({
          txStatus: SUBMISSION_STATES.PROMPT,
          txError: Just('Something went wrong!'),
        });
        return;
      }
    }

    this.setState({ txStatus: SUBMISSION_STATES.FUNDING });

    const rawTx = hexify(stx.serialize());
    const cost = state.gasLimit * toWei(state.gasPrice, 'gwei');

    const address = need.addressFromWallet(props.wallet);
    let balance = await web3.eth.getBalance(address);
    let hasBalance = balance >= cost;

    let usedTank = false;
    // if we need to, try and fund the transaction
    if (!hasBalance) {
      usedTank = await this.ensureFundsFor(web3, address, cost, [rawTx]);
      hasBalance = usedTank;
    }

    // if we still don't have sufficient balance, fail and tell the user
    if (!hasBalance) {
      this.setState({
        txStatus: SUBMISSION_STATES.PROMPT,
        txError: Just(`Insufficient funds.
          Address ${address} needs at least ${fromWei(cost.toString())} ETH,
          currently has ${fromWei(balance.toString())} ETH.`),
      });

      // if we have the balance, proceed with submission
    } else {
      this.setState({ txStatus: SUBMISSION_STATES.SENDING });

      sendSignedTransaction(
        web3,
        state.stx,
        usedTank,
        props.setTxnConfirmations
      )
        .then(txHash => {
          props.setTxnCursor(Just(Ok(txHash)));

          let routeData = {};
          if (props.newNetworkSeed) {
            props.setNetworkSeed(Just(props.newNetworkSeed));
            routeData.promptKeyfile = true;
          }

          if (props.newRevision) {
            props.setNetworkRevision(Just(props.newRevision));
          }

          props.history.popAndPush(ROUTE_NAMES.SENT_TRANSACTION, routeData);
        })
        .catch(err => {
          this.setState({
            txStatus: SUBMISSION_STATES.PROMPT,
            txError: Just(err),
          });
        });
    }
  }

  // uses the gas tank to ensure funds, but if we have to ask the user
  // for funding, just resolve instead of waiting
  // returns true if the gas tank was used, false otherwise
  ensureFundsFor(web3, address, cost, signedTxs) {
    return new Promise((resolve, reject) => {
      tank
        .ensureFundsFor(web3, null, address, cost, signedTxs, () => {
          resolve(false);
        })
        .then(res => {
          resolve(res);
        });
    });
  }

  getChainTitle(chainId) {
    let map = {
      '1': 'Mainnet - 1',
      '2': 'Morden - 2',
      '3': 'Ropsten - 3',
      '4': 'Goerli - 4',
      '42': 'Kovan - 42',
      '1337': 'Geth private chains - 1337',
      custom: 'Custom',
    };

    return map[chainId];
  }

  getChainOptions() {
    return [
      {
        title: this.getChainTitle('1'),
        value: '1',
      },
      {
        title: this.getChainTitle('2'),
        value: '2',
      },
      {
        title: this.getChainTitle('3'),
        value: '3',
      },
      {
        title: this.getChainTitle('4'),
        value: '4',
      },
      {
        title: this.getChainTitle('42'),
        value: '42',
      },
      {
        title: this.getChainTitle('1337'),
        value: '1337',
      },
      {
        title: this.getChainTitle('custom'),
        value: 'custom',
      },
    ];
  }

  render() {
    const { web3, canGenerate } = this.props;
    const {
      gasPrice,
      gasLimit,
      nonce,
      chainId,
      txn,
      stx,
      userApproval,
      showGasDetails,
      customChain,
      txStatus,
    } = this.state;

    const {
      setNonce,
      setChainId,
      setGasLimit,
      setGasPrice,
      toggleGasDetails,
      setUserApproval,
      sendTxn,
      createUnsignedTxn,
      handleChainUpdate,
    } = this;

    const { state } = this;

    const canSign = Just.hasInstance(txn);
    const canApprove = Just.hasInstance(stx);
    const canSend = Just.hasInstance(stx) && userApproval === true;

    const chainOptions = this.getChainOptions();

    const generateButtonColor = Nothing.hasInstance(txn) ? 'blue' : 'green';

    const signerButtonColor = Nothing.hasInstance(stx) ? 'blue' : 'green';

    const generateTxnButton = (
      <Button
        className={'mt-8'}
        disabled={!canGenerate}
        prop-color={generateButtonColor}
        prop-size={'lg wide'}
        onClick={createUnsignedTxn}>
        {'Generate Transaction'}
      </Button>
    );

    const unsignedTxnDisplay = txn.matchWith({
      Nothing: _ => '',
      Just: tx => (
        <React.Fragment>
          <H3 className={'mt-8'}>{'Unsigned Transaction'}</H3>
          <Code>{JSON.stringify(tx.value, null, 2)}</Code>
        </React.Fragment>
      ),
    });

    const gasPriceRangeDialogue = (
      <React.Fragment>
        <div className="mt-12 flex space-between align-baseline">
          <div>
            <span>Gas Price:</span>
            <span className="ml-4 text-700 text-sm">{gasPrice} gwei</span>
          </div>
          <div className="text-sm">
            <span>Max transaction fee: </span>
            <span className="text-700">
              {(gasPrice * gasLimit) / 1000000000} eth
            </span>
          </div>
        </div>

        <input
          className="mt-4"
          type="range"
          min="2"
          max="20"
          list="gweiVals"
          value={gasPrice}
          onChange={this.rangeChange}
        />

        <div className="flex space-between text-sm mb-8">
          <div>Cheap</div>
          <div>Fast</div>
        </div>
      </React.Fragment>
    );

    const toggleGasDetailsDialogue = (
      <span className="text-link" onClick={toggleGasDetails}>
        Gas Details
      </span>
    );

    const gasPriceDialogue = (
      <Input
        className={'mono mt-4'}
        prop-size={'md'}
        prop-format={'innerLabel'}
        value={gasPrice}
        onChange={setGasPrice}>
        <InnerLabel>{'Gas Price (gwei)'}</InnerLabel>
      </Input>
    );

    const gasLimitDialogue = (
      <Input
        className={'mono mt-4'}
        prop-size={'md'}
        prop-format={'innerLabel'}
        value={gasLimit}
        onChange={setGasLimit}>
        <InnerLabel>{'Gas Limit'}</InnerLabel>
      </Input>
    );

    const nonceDialogue = (
      <Input
        className={'mono mt-4 mb-4'}
        prop-size={'md'}
        prop-format={'innerLabel'}
        value={nonce}
        onChange={setNonce}>
        <InnerLabel>{'Nonce'}</InnerLabel>
      </Input>
    );

    const chainDialogueTitle = customChain
      ? 'Custom'
      : this.getChainTitle(chainId);
    const chainDialogue = (
      <InnerLabelDropdown
        className={'mt-6'}
        fullWidth={true}
        title={'Chain ID'}
        options={chainOptions}
        handleUpdate={handleChainUpdate}
        currentSelectionTitle={chainDialogueTitle}
      />
    );

    const customChainDialogue = !customChain ? null : (
      <Input
        className={'mono mt-4 mb-8'}
        prop-size={'md'}
        prop-format={'innerLabel'}
        value={chainId}
        onChange={setChainId}>
        <InnerLabel>{'Chain ID'}</InnerLabel>
      </Input>
    );

    const onlineParamsDialogue = web3.matchWith({
      Just: _ => <div />,
      Nothing: _ => (
        <React.Fragment>
          {nonceDialogue}
          {chainDialogue}
          {customChainDialogue}
        </React.Fragment>
      ),
    });

    const signTxnButton = (
      <Button
        disabled={!canSign}
        className={'mt-8'}
        prop-size={'lg wide'}
        prop-color={signerButtonColor}
        onClick={() =>
          signTransaction({ ...this.props, ...this.state, setStx: this.setStx })
        }>
        {'Sign Transaction'}
      </Button>
    );

    const signedTxnDisplay = stx.matchWith({
      Nothing: _ => '',
      Just: tx => (
        <React.Fragment>
          <H3 className={'mt-8'}>{'Signed Transaction'}</H3>
          <Code>{JSON.stringify(renderSignedTx(tx.value), null, 2)}</Code>
        </React.Fragment>
      ),
    });

    const confirmButton = (
      <CheckboxButton
        className={'mt-8'}
        disabled={!canApprove}
        onToggle={setUserApproval}
        state={userApproval}
        label="I approve this transaction and wish to send."
      />
    );

    const sending = txStatus !== SUBMISSION_STATES.PROMPT;
    const sendTxnSpinner = sending ? '' : 'hide';
    const sendTxnButton = (
      <Button
        prop-size={'xl wide'}
        className={'mt-8'}
        disabled={!canSend || sending}
        onClick={sendTxn}>
        <span className="relative">
          <span className={`btn-spinner ${sendTxnSpinner}`} />
          {txStatus}
        </span>
      </Button>
    );

    const sendDialogue = web3.matchWith({
      Nothing: _ => '',
      Just: _ => (
        <React.Fragment>
          {confirmButton}
          {sendTxnButton}
        </React.Fragment>
      ),
    });

    const txnErrorDialogue = Nothing.hasInstance(state.txError) ? (
      ''
    ) : (
      <Warning className={'mt-8'}>
        <H3 style={{ marginTop: 0, paddingTop: 0 }}>
          {'There was an error sending your transaction.'}
        </H3>
        {state.txError.value}
      </Warning>
    );

    return (
      <React.Fragment>
        {generateTxnButton}
        {unsignedTxnDisplay}

        {gasPriceRangeDialogue}
        {toggleGasDetailsDialogue}

        {showGasDetails && (
          <div>
            {gasPriceDialogue}
            {gasLimitDialogue}
          </div>
        )}
        {onlineParamsDialogue}

        {signTxnButton}

        {signedTxnDisplay}
        {sendDialogue}

        {txnErrorDialogue}
      </React.Fragment>
    );
  }
}

export default compose(
  withNetwork,
  withTxnConfirmations,
  withHistory,
  withWallet,
  withTxnCursor
)(StatelessTransaction);
