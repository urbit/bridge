import { Just, Nothing } from 'folktale/maybe'
import React from 'react'
import * as ob from 'urbit-ob'
import * as azimuth from 'azimuth-js'

import { BRIDGE_ERROR } from '../lib/error'
import { Row, Col, Warning, Input,
         PointInput, InnerLabel, ValidatedSigil } from '../components/Base'
import StatelessTransaction from '../components/StatelessTransaction'


class InvitesManage extends React.Component {

  constructor(props) {
    super(props)

    this.state = {
      invitesWillWork: Nothing(),
      planetInput: '',
      targetPlanet: Nothing(),
      currentPoolSize: Nothing(),
      cachedPoolSizes: {},
      targetPoolSize: 5
    }

    this.checkCurrentInvites = this.checkCurrentInvites.bind(this);
    this.handlePointInput = this.handlePointInput.bind(this);
    this.updatePoolSize = this.updatePoolSize.bind(this);
    this.handlePoolSizeInput = this.handlePoolSizeInput.bind(this);
    this.createUnsignedTxn = this.createUnsignedTxn.bind(this);
    this.statelessRef = React.createRef();
  }

  componentDidMount() {
    this.point = this.props.pointCursor.matchWith({
      Just: (pt) => parseInt(pt.value, 10),
      Nothing: () => {
        throw BRIDGE_ERROR.MISSING_POINT
      }
    });
    this.contracts = this.props.contracts.matchWith({
      Just: cs => cs.value,
      Nothing: _ => {
        throw BRIDGE_ERROR.MISSING_CONTRACTS
      }
    });

    azimuth.azimuth.isSpawnProxy(
      this.contracts,
      this.point,
      this.contracts.delegatedSending.address
    ).then(isSpawnProxy => {
      this.setState({invitesWillWork:Just(isSpawnProxy)});
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
      currentPoolSize: Nothing()
    }
    if ((targetPlanet.length === 14)
        && ob.isValidPatp(targetPlanet)) {
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
      azimuth.delegatedSending.getPool(this.contracts, who)
      .then(pool => {
        azimuth.delegatedSending.invitesInPool(this.contracts, pool)
        .then(size => {
          this.updatePoolSize(who, size);
        });
      });
      return Nothing();
    }
  }

  updatePoolSize(who, size) {
    this.state.cachedPoolSizes[who] = size;
    const target = this.state.targetPlanet;
    const match = Just.hasInstance(target) ? (who === target.value) : false;
    if (match) {
      this.setState({currentPoolSize:Just(size)});
    }
  }

  handlePoolSizeInput(targetSize) {
    this.setState({targetPoolSize: targetSize});
  }

  createUnsignedTxn() {
    return Just(azimuth.delegatedSending.setPoolSize(
      this.contracts,
      this.state.targetPlanet.value,
      this.state.targetPoolSize
    ))
  }

  render() {

    let spawnProxyWarning = null;
    if (this.state.invitesWillWork.value === false) {
      spawnProxyWarning = (
        <Warning>
          <h3 className={'mb-2'}>{'Warning'}</h3>
          {
            'Planets under this star will not be able to send invites ' +
            'until the invite contract ('
            }<code>{this.contracts.delegatedSending.address}</code>{
            ') is made spawn proxy for this star.'
          }
        </Warning>
      );
    }

    let poolSizeText = this.state.currentPoolSize.matchWith({
      Just: ps => `(currently ${ps.toString()})`,
      Nothing: _ => ''
    });

    return (
      <Row>
        <Col>

          <p>{ 'manage invites here, for stars. can only give invites to child planets' }</p>

          { spawnProxyWarning }

          <PointInput
            prop-format='innerlabel'
            prop-size='lg'
            placeholder={ '~sampel-sipnem' }
            value={ this.state.planetInput }
            onChange={ this.handlePointInput }>
            <InnerLabel>{ 'Planet to set invites for' }</InnerLabel>
            <ValidatedSigil
              patp={ this.state.targetPlanet }
              validator={() => this.validatePoint} />
          </PointInput>

          <Input
            prop-format='innerlabel'
            prop-size='lg'
            value={ this.state.targetPoolSize }
            onChange={ this.handlePoolSizeInput }>
            <InnerLabel>
              { `Available invites ${poolSizeText}` }
            </InnerLabel>
          </Input>

          <StatelessTransaction
            // Upper scope
            web3={this.props.web3}
            contracts={this.props.contracts}
            wallet={this.props.wallet}
            walletType={this.props.walletType}
            walletHdPath={this.props.walletHdPath}
            networkType={this.props.networkType}
            onSent={this.props.setTxnHashCursor}
            setTxnConfirmations={this.props.setTxnConfirmations}
            popRoute={this.props.popRoute}
            pushRoute={this.props.pushRoute}
            // Other
            canGenerate={this.state.canGenerate}
            createUnsignedTxn={this.createUnsignedTxn}
            ref={this.statelessRef} />

        </Col>
      </Row>
    )
  }
}

export default InvitesManage
