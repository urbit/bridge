import { Just, Nothing } from 'folktale/maybe';
import React from 'react';
import { Button } from '../components/old/Base';
import {
  InnerLabel,
  ValidatedSigil,
  PointInput,
  ShardInput,
  InputCaption,
  Input,
} from '../components/old/Base';
import { H1, P } from '../components/old/Base';
import * as kg from 'urbit-key-generation/dist';
import * as ob from 'urbit-ob';

import { ROUTE_NAMES } from '../lib/routeNames';
import { withHistory } from '../store/history';
import { urbitWalletFromTicket } from '../lib/wallet';
import { compose } from '../lib/lib';
import { withWallet } from '../store/wallet';
import View from 'components/View';

const placeholder = len => {
  let bytes = window.crypto.getRandomValues(new Uint8Array(len));
  let hex = bytes.reduce(
    (acc, byt) => acc + byt.toString(16).padStart(2, '0'),
    ''
  );
  return ob.hex2patq(hex);
};

const SHARDS = {
  SHARD1: Symbol('SHARD1'),
  SHARD2: Symbol('SHARD2'),
  SHARD3: Symbol('SHARD3'),
};

class Shards extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      shard1: '',
      shard2: '',
      shard3: '',
      passphrase: '',
      pointName: '',
    };

    this.pointPlaceholder = placeholder(4);
    this.ticketPlaceholder = placeholder(16);

    this.handlePassphraseInput = this.handlePassphraseInput.bind(this);
    this.handleShardInput = this.handleShardInput.bind(this);
    this.handlePointNameInput = this.handlePointNameInput.bind(this);
  }

  handleShardInput(shard, input) {
    if (shard === SHARDS.SHARD1) {
      this.setState({ shard1: input });
    } else if (shard === SHARDS.SHARD2) {
      this.setState({ shard2: input });
    } else if (shard === SHARDS.SHARD3) {
      this.setState({ shard3: input });
    }
  }

  handlePassphraseInput(passphrase) {
    this.setState({ passphrase });
  }

  handlePointNameInput(pointName) {
    if (pointName.length < 15) {
      this.setState({ pointName });
    }
  }

  async walletFromShards(shard1, shard2, shard3, pointName, passphrase) {
    const s1 = shard1 === '' ? undefined : shard1;
    const s2 = shard2 === '' ? undefined : shard2;
    const s3 = shard3 === '' ? undefined : shard3;

    let ticket = undefined;
    try {
      ticket = kg.combine([s1, s2, s3]);
    } catch (_) {
      // do nothing
    }

    if (ticket !== undefined) {
      const uhdw = await urbitWalletFromTicket(ticket, pointName, passphrase);
      this.props.setUrbitWallet(Just(uhdw));
    }
  }

  render() {
    const { history, wallet } = this.props;
    const { shard1, shard2, shard3, pointName, passphrase } = this.state;

    const phPoint = this.pointPlaceholder;
    const phTick = this.ticketPlaceholder;

    const shards = [shard1, shard2, shard3];
    const ready = shards.filter(x => x !== '').length > 1;

    return (
      <View>
        <H1>{'Authenticate'}</H1>

        <P>
          {`Enter your point and at least two of your three Urbit master
              ticket shards here. The index of the input field needs to
              match the index of the shard.`}
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

        <ShardInput
          className="mono mt-8"
          prop-size="md"
          prop-format="innerLabel"
          type="text"
          name="shard1"
          placeholder={`e.g. ${phTick}`}
          value={shard1}
          onChange={inp => this.handleShardInput(SHARDS.SHARD1, inp)}>
          <InnerLabel>{'Shard 1'}</InnerLabel>
        </ShardInput>

        <ShardInput
          className="mono mt-8"
          prop-size="md"
          prop-format="innerLabel"
          type="text"
          name="shard2"
          placeholder={`e.g. ${phTick}`}
          value={shard2}
          onChange={inp => this.handleShardInput(SHARDS.SHARD2, inp)}>
          <InnerLabel>{'Shard 2'}</InnerLabel>
        </ShardInput>

        <ShardInput
          className="mono mt-8"
          prop-size="md"
          prop-format="innerLabel"
          type="text"
          name="shard3"
          placeholder={`e.g. ${phTick}`}
          value={shard3}
          onChange={inp => this.handleShardInput(SHARDS.SHARD3, inp)}>
          <InnerLabel>{'Shard 3'}</InnerLabel>
        </ShardInput>

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
          disabled={!ready}
          className={'mt-8'}
          prop-size={'lg wide'}
          // prop-color={this.buttonTriState(wallet)}
          onClick={() =>
            this.walletFromShards(shard1, shard2, shard3, pointName, passphrase)
          }>
          {'Unlock Wallet →'}
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
)(Shards);
