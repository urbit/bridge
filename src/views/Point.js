import { Just, Nothing } from 'folktale/maybe';
import React from 'react';
import { pour } from 'sigil-js';
import * as ob from 'urbit-ob';
import * as azimuth from 'azimuth-js';
import * as need from '../lib/need';

import PointList from '../components/old/PointList';
import ReactSVGComponents from '../components/ReactSVGComponents';
import KeysAndMetadata from './Point/KeysAndMetadata';
import Actions from './Point/Actions';
import { H1, H3 } from '../components/old/Base';
import { withHistory } from '../store/history';
import { withNetwork } from '../store/network';
import { compose } from '../lib/lib';
import { withWallet } from '../store/wallet';
import { withPointCursor } from '../store/pointCursor';
import { withPointCache } from '../store/pointCache';
import View from 'components/View';

class Point extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      spawned: [],
      invites: Nothing(),
    };
  }

  componentDidMount() {
    this.cachePoints();
  }

  componentDidUpdate(prevProps) {
    //
    // NB (jtobin)
    //
    // When a link in the 'issued points' component is clicked, we don't
    // actually leave the Point component, and componentDidMount will not fire
    // again.  But, we can force a call to cachePoints here.
    //
    const oldCursor = prevProps.pointCursor.getOrElse(true);
    const newCursor = this.props.pointCursor.getOrElse(true);

    if (oldCursor !== newCursor) {
      this.cachePoints();
    }
  }

  cachePoints() {
    const { web3, contracts, pointCursor, addToPointCache } = this.props;

    web3.chain(_ =>
      contracts.chain(ctrcs =>
        pointCursor.chain(point => {
          azimuth.azimuth
            .getPoint(ctrcs, point)
            .then(details => addToPointCache({ [point]: details }));
          azimuth.delegatedSending
            .getTotalUsableInvites(ctrcs, point)
            .then(count => this.setState({ invites: Just(count) }));
          this.updateSpawned(ctrcs, point);
        })
      )
    );
  }

  updateSpawned = contracts => {
    const { pointCursor } = this.props;

    pointCursor.matchWith({
      Nothing: _ => {},
      Just: point => {
        azimuth.azimuth
          .getSpawned(contracts, point.value)
          .then(spawned => this.setState({ spawned }));
      },
    });
  };

  render() {
    const { web3, history, wallet, pointCache } = this.props;

    const { spawned } = this.state;

    const point = need.pointCursor(this.props.pointCursor);

    const pointDetails =
      point in pointCache ? Just(pointCache[point]) : Nothing();

    const name = ob.patp(point);

    const sigil = pour({
      patp: name,
      renderer: ReactSVGComponents,
      size: 256,
    });

    const online = Just.hasInstance(web3);

    const authenticated = Just.hasInstance(wallet);

    const issuedPointList =
      spawned.length === 0 ? (
        <div />
      ) : (
        <div>
          <H3>{'Issued Points'}</H3>

          <PointList routeHandler={history.popAndPush} points={spawned} />
        </div>
      );

    return (
      <View>
        <div className={'mt-12 pt-6'}>{sigil}</div>
        <H1>
          <code>{name}</code>
        </H1>
        {authenticated ? (
          <Actions
            online={online}
            point={point}
            pointDetails={pointDetails}
            invites={this.state.invites}
          />
        ) : null}

        {online ? <KeysAndMetadata pointDetails={pointDetails} /> : <div />}
        {issuedPointList}
      </View>
    );
  }
}

export default compose(
  withNetwork,
  withHistory,
  withWallet,
  withPointCursor,
  withPointCache
)(Point);
