import { Nothing, Just } from 'folktale/maybe';
import React from 'react';
import * as azimuth from 'azimuth-js';

import { H1, Row, Col } from '../components/old/Base';
import Tabs from '../components/Tabs';

import Ticket from './Login/Ticket';
import Mnemonic from './Login/Mnemonic';
import Advanced from './Login/Advanced';

import * as need from '../lib/need';
import { compose } from '../lib/lib';
import { ROUTE_NAMES } from '../lib/routeNames';

import { withHistory } from '../store/history';
import { withNetwork } from '../store/network';
import { withWallet } from '../store/wallet';
import { withPointCursor } from '../store/pointCursor';

const TABS = {
  TICKET: Symbol('TICKET'),
  MNEMONIC: Symbol('MNEMONIC'),
  ADVANCED: Symbol('ADVANCED'),
};

class Login extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      currentTab: TABS.TICKET,
    };

    this.handleTabChange = this.handleTabChange.bind(this);
    this.continue = this.continue.bind(this);
  }

  componentDidMount() {
    // we expect wallet and pointCursor to not be set yet
    this.props.setUrbitWallet(Nothing());
    this.props.setWallet(Nothing());
    this.props.setPointCursor(Nothing());
  }

  handleTabChange(currentTab) {
    this.setState({ currentTab });
  }

  async continue() {
    const wallet = need.wallet(this.props);
    const contracts = need.contracts(this.props);

    // if no point cursor set by login logic, try to deduce it
    let deduced = Nothing();
    if (Nothing.hasInstance(this.props.pointCursor)) {
      const owned = await azimuth.azimuth.getOwnedPoints(
        contracts,
        wallet.address
      );
      if (owned.length === 1) {
        deduced = Just(owned[0]);
      } else if (owned.length === 0) {
        const canOwn = await azimuth.azimuth.getTransferringFor(
          contracts,
          wallet.address
        );
        if (canOwn.length === 1) {
          deduced = Just(canOwn[0]);
        }
      }
    }

    // if we have a deduced point or one in the global context,
    // navigate to that specific point, otherwise navigate to list of points
    if (Just.hasInstance(deduced)) {
      this.props.setPointCursor(deduced);
      this.props.history.popAndPush(ROUTE_NAMES.POINT);
    } else if (Just.hasInstance(this.props.pointCursor)) {
      this.props.history.popAndPush(ROUTE_NAMES.POINT);
    } else {
      this.props.history.popAndPush(ROUTE_NAMES.POINTS);
    }
  }

  render() {
    const tabOptions = [
      { title: 'Ticket', value: TABS.TICKET },
      { title: 'Mnemonic', value: TABS.MNEMONIC },
      { title: 'Advanced', value: TABS.ADVANCED },
    ];

    const tabViews = {
      [TABS.TICKET]: Ticket,
      [TABS.MNEMONIC]: Mnemonic,
      [TABS.ADVANCED]: Advanced,
    };

    return (
      <Row>
        <Col>
          <H1>{'Login'}</H1>

          <Tabs
            tabViews={tabViews}
            tabOptions={tabOptions}
            currentTab={this.state.currentTab}
            onTabChange={this.handleTabChange}
            //
            loginCompleted={this.continue}
          />
        </Col>
      </Row>
    );
  }
}

export default compose(
  withHistory,
  withNetwork,
  withWallet,
  withPointCursor
)(Login);
