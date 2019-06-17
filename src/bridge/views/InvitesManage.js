import { Just, Nothing } from 'folktale/maybe';
import React from 'react';
import * as ob from 'urbit-ob';
import * as azimuth from 'azimuth-js';
import * as need from '../lib/need';

import {
  Row,
  Col,
  Warning,
  Input,
  PointInput,
  InnerLabel,
  ValidatedSigil,
} from '../components/Base';
import StatelessTransaction from '../components/StatelessTransaction';
import { withNetwork } from '../store/network';
import { compose } from '../lib/lib';
import { withPointCursor } from '../store/pointCursor';

class InvitesManage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      invitesWillWork: Nothing(),
      planetInput: '',
      targetPlanet: Nothing(),
      currentPoolSize: Nothing(),
      cachedPoolSizes: {},
      targetPoolSize: 5,
    };

    this.checkCurrentInvites = this.checkCurrentInvites.bind(this);
    this.handlePointInput = this.handlePointInput.bind(this);
    this.updatePoolSize = this.updatePoolSize.bind(this);
    this.handlePoolSizeInput = this.handlePoolSizeInput.bind(this);
    this.createUnsignedTxn = this.createUnsignedTxn.bind(this);
    this.statelessRef = React.createRef();
  }

  componentDidMount() {
    this.point = need.pointCursor(this.props);
    this.contracts = need.contracts(this.props);

    azimuth.azimuth
      .isSpawnProxy(
        this.contracts,
        this.point,
        this.contracts.delegatedSending.address
      )
      .then(isSpawnProxy => {
        this.setState({ invitesWillWork: Just(isSpawnProxy) });
      });
  }

  componentDidUpdate(prevProps) {
    //
  }

  handlePointInput(targetPlanet) {
    let newState = {
      targetPlanet: Nothing(),
      planetInput: targetPlanet,
      canGenerate: false,
      currentPoolSize: Nothing(),
    };
    if (targetPlanet.length === 14 && ob.isValidPatp(targetPlanet)) {
      const target = ob.patp2dec(targetPlanet);
      //TODO there must be a simpler way to do this check
      const isChild = ob.sein(targetPlanet) === ob.patp(this.point);
      if (isChild) {
        newState.targetPlanet = Just(target);
        newState.currentPoolSize = this.checkCurrentInvites(target);
        newState.canGenerate = true;
      }
    }
    this.setState(newState);
  }

  checkCurrentInvites(who) {
    const cachedPoolSizes = this.state.cachedPoolSizes;
    if (typeof cachedPoolSizes[who] !== 'undefined') {
      return Just(cachedPoolSizes[who]);
    } else {
      azimuth.delegatedSending.getPool(this.contracts, who).then(pool => {
        azimuth.delegatedSending
          .invitesInPool(this.contracts, pool, this.point)
          .then(size => {
            this.updatePoolSize(who, size);
          });
      });
      return Nothing();
    }
  }

  updatePoolSize(who, size) {
    const cache = this.state.cachedPoolSizes;
    cache[who] = size;
    this.setState({ cachedPoolSizes: cache });
    const target = this.state.targetPlanet;
    const match = Just.hasInstance(target) ? who === target.value : false;
    if (match) {
      this.setState({ currentPoolSize: Just(size) });
    }
  }

  handlePoolSizeInput(targetSize) {
    this.setState({ targetPoolSize: targetSize });
  }

  createUnsignedTxn() {
    return Just(
      azimuth.delegatedSending.setPoolSize(
        this.contracts,
        this.point,
        this.state.targetPlanet.value,
        this.state.targetPoolSize
      )
    );
  }

  render() {
    let spawnProxyWarning = null;
    if (this.state.invitesWillWork.value === false) {
      spawnProxyWarning = (
        <Warning>
          <h3 className={'mb-2'}>{'Warning'}</h3>
          {'Planets under this star will not be able to send invites ' +
            'until the invite contract ('}
          <code>{this.contracts.delegatedSending.address}</code>
          {') is made spawn proxy for this star.'}
        </Warning>
      );
    }

    let poolSizeText = this.state.currentPoolSize.matchWith({
      Just: ps => `(currently ${ps.value})`,
      Nothing: _ => '',
    });

    return (
      <Row>
        <Col>
          <p>
            {
              'manage invites here, for stars. can only give invites to child planets'
            }
          </p>

          {spawnProxyWarning}

          <PointInput
            prop-format="innerlabel"
            prop-size="lg"
            placeholder={'~sampel-sipnem'}
            value={this.state.planetInput}
            onChange={this.handlePointInput}>
            <InnerLabel>{'Planet to set invites for'}</InnerLabel>
            <ValidatedSigil
              patp={this.state.targetPlanet}
              validator={() => this.validatePoint}
            />
          </PointInput>

          <Input
            prop-format="innerlabel"
            prop-size="lg"
            value={this.state.targetPoolSize}
            onChange={this.handlePoolSizeInput}>
            <InnerLabel>{`Available invites ${poolSizeText}`}</InnerLabel>
          </Input>

          <StatelessTransaction
            // Upper scope
            {...this.props}
            // Other
            canGenerate={this.state.canGenerate}
            createUnsignedTxn={this.createUnsignedTxn}
            ref={this.statelessRef}
          />
        </Col>
      </Row>
    );
  }
}

export default compose(
  withNetwork,
  withPointCursor
)(InvitesManage);
