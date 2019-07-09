import React from 'react';
import { Just } from 'folktale/maybe';
import * as azimuth from 'azimuth-js';
import * as ob from 'urbit-ob';

import { H1, P } from '../components/old/Base';
import * as need from '../lib/need';

import StatelessTransaction from '../components/old/StatelessTransaction';
import { ETH_ZERO_ADDR } from '../lib/wallet';
import { withNetwork } from '../store/network';
import { compose } from '../lib/lib';
import { withPointCursor } from '../store/pointCursor';
import { withPointCache } from '../store/pointCache';
import View from 'components/View';

class CancelTransfer extends React.Component {
  constructor(props) {
    super(props);

    const pointInTransfer = need.point(props.pointCursor);

    this.state = {
      proxyAddress: '',
      pointInTransfer: pointInTransfer,
    };

    this.createUnsignedTxn = this.createUnsignedTxn.bind(this);
  }

  createUnsignedTxn() {
    const { props } = this;

    const validContracts = need.contracts(props.contracts);
    const validPoint = need.point(props.pointCursor);
    //TODO this.state.pointInTransfer ?

    const txn = azimuth.ecliptic.setTransferProxy(
      validContracts,
      validPoint,
      ETH_ZERO_ADDR
    );

    return Just(txn);
  }

  render() {
    const { props, state } = this;

    const online = Just.hasInstance(props.web3);

    const proxy = online
      ? props.pointCache[state.pointInTransfer].transferProxy
      : 'any outgoing addresses';

    // const canGenerate = validAddress === true

    const canGenerate = true;

    return (
      <View>
        <H1>
          {'Cancel Transfer of '}{' '}
          <code>{` ${ob.patp(state.pointInTransfer)} `}</code>
        </H1>

        <P>{`This action will cancel the transfer to ${proxy}.`}</P>
        <StatelessTransaction
          canGenerate={canGenerate}
          createUnsignedTxn={this.createUnsignedTxn}
        />
      </View>
    );
  }
}

export default compose(
  withNetwork,
  withPointCursor,
  withPointCache
)(CancelTransfer);
