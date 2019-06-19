import { Nothing, Just } from 'folktale/maybe';
import React from 'react';
import * as azimuth from 'azimuth-js';
import * as ob from 'urbit-ob';

import {
  Button,
  H1,
  InnerLabel,
  PointInput,
  ValidatedSigil,
  TicketInput,
  Row,
  Col,
} from '../components/Base';
import HorizontalSelector from '../components/HorizontalSelector';

import Ticket from './Login/Ticket';
import Mnemonic from './Login/Mnemonic';
import Advanced from './Login/Advanced';

import * as need from '../lib/need';
import { compose } from '../lib/lib';
import { urbitWalletFromTicket } from '../lib/wallet';
import { ROUTE_NAMES } from '../lib/routeNames';
import { NETWORK_TYPES } from '../lib/network';

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
      wallet: Nothing(),
    };

    this.handleTabChange = this.handleTabChange.bind(this);
    this.continue = this.continue.bind(this);
  }

  componentDidMount() {
    this.props.setNetworkType(this.props.networkType);
    // we expect pointCursor to not be set yet
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

    if (Just.hasInstance(deduced)) {
      this.props.setPointCursor(deduced);
      this.props.history.popAndPush(ROUTE_NAMES.POINT_HOME);
    } else if (Just.hasInstance(this.props.pointCursor)) {
      this.props.history.popAndPush(ROUTE_NAMES.POINT_HOME);
    } else {
      //TODO to new overview (maybe should be merged into point home?)
      this.props.history.popAndPush(ROUTE_NAMES.SHIPS);
    }
  }

  render() {
    const tabOptions = [
      { title: 'Ticket', value: TABS.TICKET },
      { title: 'Mnemonic', value: TABS.MNEMONIC },
      { title: 'Advanced', value: TABS.ADVANCED },
    ];

    //TODO probably needs a dedicated component because styling
    const tabs = (
      <HorizontalSelector
        options={tabOptions}
        onChange={this.handleTabChange}
      />
    );

    const login = (() => {
      switch (this.state.currentTab) {
        case TABS.TICKET:
          return <Ticket loginCompleted={this.continue} />;
        case TABS.MNEMONIC:
          return <Mnemonic loginCompleted={this.continue} />;
        case TABS.ADVANCED:
          return <Advanced loginCompleted={this.continue} />;
        default:
          throw new Error('weird tab ' + this.status.currentTab);
      }
    })();

    return (
      <Row>
        <Col>
          <H1>{'Login'}</H1>

          {tabs}
          {login}
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
