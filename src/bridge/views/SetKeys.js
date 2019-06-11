import React from 'react';
import Maybe from 'folktale/maybe';
import * as azimuth from 'azimuth-js';
import * as ob from 'urbit-ob';
import * as need from '../lib/need';
import { Row, Col, H1, P, Warning, CheckboxButton } from '../components/Base';

import StatelessTransaction from '../components/StatelessTransaction';
import { attemptSeedDerivation } from '../lib/keys';

import * as kg from '../../../node_modules/urbit-key-generation/dist/index';

import { addHexPrefix } from '../lib/wallet';

class SetKeys extends React.Component {
  constructor(props) {
    super(props);

    const point = need.pointCursor(props);

    this.state = {
      auth: '',
      encr: '',
      networkSeed: '',
      nondeterministicSeed: false,
      point: point,
      cryptoSuiteVersion: 1,
      discontinuity: false,
      isManagementSeed: false,
    };

    this.toggleDiscontinuity = this.toggleDiscontinuity.bind(this);
    // Transaction
    this.createUnsignedTxn = this.createUnsignedTxn.bind(this);
  }

  toggleDiscontinuity() {
    this.setState({ discontinuity: !this.state.discontinuity });
  }

  componentDidMount() {
    const { props } = this;

    this.deriveSeed();

    const addr = need.address(props);

    this.determineManagementSeed(props.contracts.value, addr);
  }

  async determineManagementSeed(ctrcs, addr) {
    const managing = await azimuth.azimuth.getManagerFor(ctrcs, addr);

    this.setState({
      isManagementSeed: managing.length !== 0,
    });
  }

  //TODO use web3.utils.randomHex when it gets fixed, see web3.js#1490
  randomHex(len) {
    let hex = '';

    for (var i = 0; i < len; i++) {
      hex =
        hex +
        [
          '0',
          '1',
          '2',
          '3',
          '4',
          '5',
          '6',
          '7',
          '8',
          '9',
          'A',
          'B',
          'C',
          'D',
          'E',
          'F',
        ][Math.floor(Math.random() * 16)];
    }

    return hex;
  }

  async deriveSeed() {
    const next = true;
    let seed = await attemptSeedDerivation(next, this.props);
    let nondeterministicSeed = false;

    if (seed.getOrElse('') === '') {
      seed = Maybe.Just(this.randomHex(64));
      nondeterministicSeed = true;
    }

    this.setState({
      networkSeed: seed.getOrElse(''),
      nondeterministicSeed: nondeterministicSeed,
    });
  }

  createUnsignedTxn() {
    const { state, props } = this;

    const validContracts = need.contracts(props);

    const validPoint = need.pointCursor(props);

    const hexRegExp = /[0-9A-Fa-f]{64}/g;

    if (hexRegExp.test(state.networkSeed)) {
      // derive network keys
      const pair = kg.deriveNetworkKeys(state.networkSeed);

      const pencr = addHexPrefix(pair.crypt.public);
      const pauth = addHexPrefix(pair.auth.public);

      const txn = azimuth.ecliptic.configureKeys(
        validContracts,
        validPoint,
        pencr,
        pauth,
        1,
        state.discontinuity
      );

      return Maybe.Just(txn);
    }

    return Maybe.Nothing();
  }

  render() {
    const { props, state } = this;

    const canGenerate =
      state.networkSeed.length === 64 && state.networkSeed.length === 64;

    const pointDetails = need.fromPointCache(props, state.point);

    return (
      <Row>
        <Col>
          <H1>
            {'Set Network Keys For '} <code>{`${ob.patp(state.point)}`}</code>
          </H1>

          <P className="mt-10">
            {`Set new authentication and encryption keys for your Arvo ship.`}
          </P>

          {state.nondeterministicSeed && (
            <Warning>
              <h3 className={'mb-2'}>{'Warning'}</h3>
              {`Your network seed could not be derived automatically. We've
                generated a random one for you, so you must download your Arvo
                keyfile during this session after setting your keys.`}
            </Warning>
          )}

          {pointDetails.keyRevisionNumber === 0 ? (
            <Warning>
              <h3 className={'mb-2'}>{'Warning'}</h3>
              {'Once these keys have been set, your point is considered ' +
                "'linked'.  This operation cannot be undone."}
            </Warning>
          ) : (
            <div />
          )}

          <CheckboxButton
            className="mt-8"
            onToggle={this.toggleDiscontinuity}
            state={state.discontinuity}
            label={`I have lost important off-chain data relating to this point
                    and need to do a hard reset.
                    (For example, rebooting an Arvo ship.)`}></CheckboxButton>

          <StatelessTransaction
            // Upper scope
            {...props}
            // Tx
            canGenerate={canGenerate}
            createUnsignedTxn={this.createUnsignedTxn}
            networkSeed={state.networkSeed}
            newRevision={parseInt(pointDetails.keyRevisionNumber) + 1}
            setNetworkSeedCache={props.setNetworkSeedCache}
          />
        </Col>
      </Row>
    );
  }
}

export default SetKeys;
