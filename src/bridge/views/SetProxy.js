import Maybe from 'folktale/maybe'
import React from 'react'
import * as azimuth from 'azimuth-js'
import { Row, Col, H1, H3, P, InnerLabel, ShowBlockie, Anchor } from '../components/Base'
import { AddressInput, Warning } from '../components/Base'
import * as ob from 'urbit-ob'

import { PROXY_TYPE, renderProxyType } from '../lib/proxy'
import { BRIDGE_ERROR } from '../lib/error'

import { NETWORK_NAMES } from '../lib/network'

import StatelessTransaction from '../components/StatelessTransaction'

import { ROUTE_NAMES } from '../lib/router'

import {
  sendSignedTransaction,
  fromWei,
 } from '../lib/txn'

import {
  isValidAddress,
  addressFromSecp256k1Public,
} from '../lib/wallet'

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

    const issuingPoint = props.pointCursor.matchWith({
      Just: (shp) => shp.value,
      Nothing: () => {
        throw BRIDGE_ERROR.MISSING_POINT
      }
    })

    this.state = {
      proxyAddress: '',
      issuingPoint: issuingPoint,
    }

    this.handleAddressInput = this.handleAddressInput.bind(this)
  }

  createUnsignedTxn(proxyAddress) {
    const { state, props } = this

    const validContracts = props.contracts.matchWith({
      Just: (cs) => cs.value,
      Nothing: () => {
        throw BRIDGE_ERROR.MISSING_CONTRACTS
      }
    })

    const validPoint = props.pointCursor.matchWith({
      Just: (shp) => shp.value,
      Nothing: () => {
        throw BRIDGE_ERROR.MISSING_POINT
      }
    })

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

    const canSign = Maybe.Just.hasInstance(state.txn)
    const canApprove = Maybe.Just.hasInstance(state.stx)
    const canSend = Maybe.Just.hasInstance(state.stx) && state.userApproval === true

    const esvisible =
        props.networkType === NETWORK_NAMES.ROPSTEN ||
        props.networkType === NETWORK_NAMES.MAINNET

    const esdomain =
        props.networkType === NETWORK_NAMES.ROPSTEN
      ? "ropsten.etherscan.io"
      : "etherscan.io"

    const ucFirst = w => w.charAt(0).toUpperCase() + w.slice(1);


    return (
      <Row>
        <Col>
          <H1>
            { `Set ${ucFirst(renderedProxyType)} Proxy For ` }
            <code>{ `${ob.patp(state.issuingPoint)}` }</code>
          </H1>

          <P>
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

          <StatelessTransaction
            // Upper scope
            web3={props.web3}
            contracts={props.contracts}
            wallet={props.wallet}
            walletType={props.walletType}
            walletHdPath={props.walletHdPath}
            networkType={props.networkType}
            // Tx
            txn={state.txn}
            stx={state.stx}
            // Tx details
            nonce={state.nonce}
            gasPrice={state.gasPrice}
            chainId={state.chainId}
            gasLimit={state.gasLimit}
            showGasDetails={state.showGasDetails}
            toggleGasDetails={this.toggleGasDetails}
            // Checks
            userApproval={state.userApproval}
            canGenerate={ canGenerate }
            canSign={ canSign }
            canApprove={ canApprove }
            canSend={ canSend }
            // Methods
            createUnsignedTxn={this.handleCreateUnsignedTxn}
            setUserApproval={this.handleSetUserApproval}
            setTxn={this.handleSetTxn}
            setStx={this.handleSetStx}
            setNonce={this.handleSetNonce}
            setChainId={this.handleSetChainId}
            setGasPrice={this.handleSetGasPrice}
            setGasLimit={this.handleSetGasLimit}
            handleSubmit={this.handleSubmit} />

            {
              Maybe.Nothing.hasInstance(state.txError)
                ? ''
                : <Warning className={'mt-8'}>
                    <H3 style={{marginTop: 0, paddingTop: 0}}>
                      {
                        'There was an error sending your transaction.'
                      }
                    </H3>
                    { state.txError.value }
                </Warning>
            }

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
