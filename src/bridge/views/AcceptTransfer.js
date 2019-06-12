import { Just } from 'folktale/maybe';
import React from 'react';
import { Row, Col, H1, P } from '../components/Base';
import {
  InnerLabel,
  AddressInput,
  ShowBlockie,
  Anchor,
} from '../components/Base';
import * as azimuth from 'azimuth-js';
import * as ob from 'urbit-ob';
import * as need from '../lib/need';

import StatelessTransaction from '../components/StatelessTransaction';
import { NETWORK_TYPES } from '../lib/network';
import { isValidAddress } from '../lib/wallet';
import { withNetwork } from '../store/network';
import { compose } from '../lib/lib';

class AcceptTransfer extends React.Component {
  constructor(props) {
    super(props);

    const receivingAddress = need.address(props);

    const incomingPoint = need.pointCursor(props);

    this.state = {
      receivingAddress: receivingAddress,
      incomingPoint: incomingPoint,
    };

    this.handleAddressInput = this.handleAddressInput.bind(this);
    this.createUnsignedTxn = this.createUnsignedTxn.bind(this);
    this.statelessRef = React.createRef();
  }

  handleAddressInput(proxyAddress) {
    this.setState({ proxyAddress });
    this.statelessRef.current.clearTxn();
  }

  createUnsignedTxn() {
    const { state, props } = this;

    const validContracts = need.contracts(props);

    const validPoint = need.pointCursor(props); //TODO state.incomingPoint ?

    return Just(
      azimuth.ecliptic.transferPoint(
        validContracts,
        validPoint,
        state.receivingAddress,
        true
      )
    );
  }

  render() {
    const { state, props } = this;
    const validAddress = isValidAddress(state.receivingAddress);
    const canGenerate = validAddress === true;

    const esvisible =
      props.networkType === NETWORK_TYPES.ROPSTEN ||
      props.networkType === NETWORK_TYPES.MAINNET;

    const esdomain =
      props.networkType === NETWORK_TYPES.ROPSTEN
        ? 'ropsten.etherscan.io'
        : 'etherscan.io';

    return (
      <Row>
        <Col>
          <H1>
            {'Accept Transfer of '}{' '}
            <code>{` ${ob.patp(state.incomingPoint)} `}</code>
          </H1>

          <P>
            {"By default, the recipient is the address you're logged in " +
              'as.  But you can transfer to any address you like.'}
          </P>

          <AddressInput
            className="mono mt-8"
            prop-size="lg"
            prop-format="innerLabel"
            value={state.receivingAddress}
            onChange={v => this.handleAddressInput(v)}>
            <InnerLabel>{'Receiving Address'}</InnerLabel>
            <ShowBlockie className={'mt-1'} address={state.receivingAddress} />
          </AddressInput>

          <Anchor
            className={'mt-1 sm'}
            prop-size="sm"
            prop-disabled={
              !isValidAddress(state.receivingAddress) || !esvisible
            }
            target={'_blank'}
            href={`https://${esdomain}/address/${state.receivingAddress}`}>
            {'View on Etherscan ↗'}
          </Anchor>

          <StatelessTransaction
            // Upper scope
            {...props}
            // Other
            canGenerate={canGenerate}
            createUnsignedTxn={this.createUnsignedTxn}
            ref={this.statelessRef}
          />
        </Col>
      </Row>
    );
  }
}

export default compose(withNetwork)(AcceptTransfer);
