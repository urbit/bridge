import Maybe from 'folktale/maybe'
import React from 'react'
import * as need from '../lib/need'
import * as azimuth from 'azimuth-js'
import { Row, Col, H1, P, InnerLabel, ShowBlockie, Anchor, HorizontalSelector } from '../components/Base'
import { AddressInput } from '../components/Base'
import * as ob from 'urbit-ob'

import { PROXY_TYPE, renderProxyType } from '../lib/proxy'

import { NETWORK_NAMES } from '../lib/network'

import StatelessTransaction from '../components/StatelessTransaction'

import { isValidAddress } from '../lib/wallet'

const SetManagementProxy = (props) =>
  <SetProxy
    { ...props }
    proxyType={ PROXY_TYPE.MANAGEMENT_PROXY }
  />

const SetSpawnProxy = (props) =>
  <SetProxy
    { ...props }
    proxyType={ PROXY_TYPE.SPAWN_PROXY }
  />

const SetTransferProxy = (props) =>
  <SetProxy
    { ...props }
    proxyType={ PROXY_TYPE.TRANSFER_PROXY }
  />

class SetProxy extends React.Component {
  constructor(props) {
    super(props)

    const issuingPoint = need.pointCursor(props);

    this.state = {
      proxyAddress: '',
      issuingPoint: issuingPoint,
      setProxy: true
    }

    this.statelessRef = React.createRef();
    this.handleSetUnset = this.handleSetUnset.bind(this);
    this.handleAddressInput = this.handleAddressInput.bind(this)
    this.createUnsignedTxn = this.createUnsignedTxn.bind(this)
  }

  handleSetUnset(selected) {
    const set = (selected === 'set');
    this.setState({
      setProxy: set,
      proxyAddress: set ? '' : '0x0000000000000000000000000000000000000000'
    });
  }

  handleAddressInput(proxyAddress) {
    this.setState({ proxyAddress })

    this.statelessRef.current.clearTxn()
  }

  createUnsignedTxn(proxyAddress) {
    const { state, props } = this

    const validContracts = need.contracts(props);

    const validPoint = need.pointCursor(props);

    const txArgs = [
      validContracts,
      validPoint,
      state.proxyAddress
    ]

    if (props.proxyType === PROXY_TYPE.TRANSFER_PROXY) {
      return Maybe.Just(azimuth.ecliptic.setTransferProxy(...txArgs))
    }

    if (props.proxyType === PROXY_TYPE.SPAWN_PROXY) {
      return Maybe.Just(azimuth.ecliptic.setSpawnProxy(...txArgs))
    }

    if (props.proxyType === PROXY_TYPE.MANAGEMENT_PROXY) {
      return Maybe.Just(azimuth.ecliptic.setManagementProxy(...txArgs))
    }

    return Maybe.Nothing()

  }

  render() {
    const { props, state } = this

    const renderedProxyType = renderProxyType(props.proxyType)
    const validAddress = isValidAddress(state.proxyAddress)
    const canGenerate = validAddress === true

    const esvisible =
        props.networkType === NETWORK_NAMES.ROPSTEN ||
        props.networkType === NETWORK_NAMES.MAINNET

    const esdomain =
        props.networkType === NETWORK_NAMES.ROPSTEN
      ? "ropsten.etherscan.io"
      : "etherscan.io"

    const ucFirst = w => w.charAt(0).toUpperCase() + w.slice(1);

    const setUnset = [
      { title: 'Set', value: 'set' },
      { title: 'Unset', value: 'unset' }
    ];

    const titleVerb = this.state.setProxy ? 'Set' : 'Unset';

    let addressInput = null;
    if (this.state.setProxy) {
      addressInput = (<>
        <P className='mt-8'>
        {
          'Please provide an Ethereum address to act as the ' +
          `${renderedProxyType} proxy.  You can also use Wallet ` +
          'Generator to generate a keypair.'
        }
        </P>

        <AddressInput
          className='mono mt-8'
          prop-size='lg'
          prop-format='innerLabel'
          placeholder={ `e.g. 0x84295d5e054d8cff5a22428b195f5a1615bd644f` }
          value={ state.proxyAddress }
          onChange={ v => this.handleAddressInput(v) }>
          <InnerLabel>{ 'Proxy Address' }</InnerLabel>
          <ShowBlockie className={'mt-1'} address={state.proxyAddress} />
        </AddressInput>

        <Anchor
          className={'mt-1'}
          prop-size={'sm'}
          prop-disabled={!isValidAddress(state.proxyAddress) || !esvisible}
          target={'_blank'}
          href={`https://${esdomain}/address/${state.proxyAddress}`}>
            {'View on Etherscan ↗'}
        </Anchor>
      </>)
    }

    return (
      <Row>
        <Col>
          <H1>
            { `${titleVerb} ${ucFirst(renderedProxyType)} Proxy For ` }
            <code>{ `${ob.patp(state.issuingPoint)}` }</code>
          </H1>

          <HorizontalSelector
            options={setUnset}
            onChange={this.handleSetUnset}
            className='mt-8'
          />

          { addressInput }

          <StatelessTransaction
            // Upper scope
            {...props}
            // Other
            ref={this.statelessRef}
            createUnsignedTxn={this.createUnsignedTxn}
            canGenerate={ canGenerate } />
        </Col>
      </Row>
    )
  }
}

export {
  SetManagementProxy,
  SetSpawnProxy,
  SetTransferProxy
}
