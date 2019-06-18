import Maybe from 'folktale/maybe';
import React from 'react';
import { Row, Col, H1, P } from '../components/old/Base';
import * as azimuth from 'azimuth-js';
import * as ob from 'urbit-ob';
import * as need from '../lib/need';

import StatelessTransaction from '../components/old/StatelessTransaction';
import { ETH_ZERO_ADDR } from '../lib/wallet';
import { withNetwork } from '../store/network';
import { compose } from '../lib/lib';
import { withPointCursor } from '../store/pointCursor';
import { withPointCache } from '../store/pointCache';

class CancelTransfer extends React.Component {
  constructor(props) {
    super(props);

    const pointInTransfer = need.pointCursor(props);

    this.state = {
      proxyAddress: '',
      pointInTransfer: pointInTransfer,
    };

    this.createUnsignedTxn = this.createUnsignedTxn.bind(this);
  }

  createUnsignedTxn() {
    const { props } = this;

    const validContracts = need.contracts(props);

    const validPoint = need.pointCursor(props); //TODO this.state.pointInTransfer ?

    const txn = azimuth.ecliptic.setTransferProxy(
      validContracts,
      validPoint,
      ETH_ZERO_ADDR
    );

    return Maybe.Just(txn);
  }

  render() {
    const { props, state } = this;

    const online = Maybe.Just.hasInstance(props.web3);

    const proxy = online
      ? props.pointCache[state.pointInTransfer].transferProxy
      : 'any outgoing addresses';

    // const canGenerate = validAddress === true

    const canGenerate = true;

    return (
      <Row>
        <Col>
          <H1>
            {'Cancel Transfer of '}{' '}
            <code>{` ${ob.patp(state.pointInTransfer)} `}</code>
          </H1>

          <P>{`This action will cancel the transfer to ${proxy}.`}</P>
          <StatelessTransaction
            canGenerate={canGenerate}
            createUnsignedTxn={this.createUnsignedTxn}
          />
        </Col>
      </Row>
    );
  }
}

export default compose(
  withNetwork,
  withPointCursor,
  withPointCache
)(CancelTransfer);
