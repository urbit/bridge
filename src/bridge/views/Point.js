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
import { withHistory } from '../store/history';
import { withNetwork } from '../store/network';
import { compose } from '../lib/lib';

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
    const { web3, history, wallet, setPointCursor, pointCache } = this.props;

    const { spawned } = this.state;

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

    const issuedPointList =
      spawned.length === 0 ? (
        <div />
      ) : (
        <div>
          <H3>{'Issued Points'}</H3>

          <PointList
            setPointCursor={setPointCursor}
            routeHandler={history.popAndPush}
            points={spawned}
          />
        </div>
      );

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
          {issuedPointList}
        </Col>
      </Row>
    );
  }
}

export default compose(
  withNetwork,
  withHistory
)(Point);
