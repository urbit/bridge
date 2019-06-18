import { Just, Nothing } from 'folktale/maybe';
import React from 'react';
import { pour } from 'sigil-js';
import * as ob from 'urbit-ob';
import * as azimuth from 'azimuth-js';
import * as need from '../lib/need';

import PointList from '../components/PointList';
import ReactSVGComponents from '../components/ReactSVGComponents';
import KeysAndMetadata from './Point/KeysAndMetadata';
import Actions from './Point/Actions';
import { Row, Col, H1, H3 } from '../components/Base';

import { compose } from '../lib/lib';
import { ROUTE_NAMES } from '../lib/routeNames';

import { withHistory } from '../store/history';
import { withNetwork } from '../store/network';
import { withPointCursor } from '../store/pointCursor';
import { withPointCache } from '../store/pointCache';

class PointHome extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      birthday: Nothing(),
      spawned: [],
      invites: Nothing(),
    };
  }

  componentDidMount() {
    this.cachePoints();
    this.updateBirthday();
  }

  //TODO can probably re-use this to implement point switching
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

  async updateBirthday(blockNumber) {
    const birthBlock = await azimuth.azimuth.getActivationBlock(
      need.contracts(this.props),
      need.pointCursor(this.props)
    );
    if (birthBlock === 0) {
      this.setState({ birthday: Nothing() });
    } else {
      const block = await need.web3(this.props).eth.getBlock(birthBlock);
      this.setState({ birthday: Just(new Date(block.timestamp * 1000)) });
    }
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
    const { web3, history, wallet, setPointCursor, pointCache } = this.props;

    const point = need.pointCursor(this.props);

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

    return (
      <Row>
        <Col>
          <div className={'mt-12 pt-6'}>{sigil}</div>
          <H1>
            <code>{name}</code>
          </H1>
          {authenticated ? (
            <Actions
              online={online}
              wallet={wallet}
              point={point}
              pointDetails={pointDetails}
              invites={this.state.invites}
            />
          ) : null}

          {online ? <KeysAndMetadata pointDetails={pointDetails} /> : <div />}
        </Col>
      </Row>
    );
  }
}

export default compose(
  withNetwork,
  withHistory,
  withPointCursor,
  withPointCache
)(PointHome);
