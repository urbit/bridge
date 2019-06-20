import { Just, Nothing } from 'folktale/maybe';
import React from 'react';
import * as azimuth from 'azimuth-js';
import * as need from '../lib/need';

import { Row, Col, P } from '../components/Base';

import { compose } from '../lib/lib';

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

  async updateBirthday() {
    const birthBlock = await azimuth.azimuth.getActivationBlock(
      need.contracts(this.props),
      need.pointCursor(this.props)
    );
    if (birthBlock === 0) {
      this.setState({ birthday: Nothing() });
    } else {
      const block = await need.web3(this.props).eth.getBlock(birthBlock);
      //TODO add to point cache
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
    return (
      <Row>
        <Col>
          <P>Admin</P>

          <P>Boot Arvo</P>

          <P>Invite</P>
        </Col>
      </Row>
    );
  }
}

export default compose(
  withNetwork,
  withPointCursor,
  withPointCache
)(PointHome);
