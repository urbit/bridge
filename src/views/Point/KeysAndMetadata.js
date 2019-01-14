import React from 'react'
import { Row, Col, H2, H4 } from '../../components/Base'

import { ETH_ZERO_ADDR, eqAddr } from '../../lib/wallet'

const NULL_KEY =
  '0x0000000000000000000000000000000000000000000000000000000000000000'

const renderAddress = (addr) =>
    eqAddr(addr, ETH_ZERO_ADDR)
  ? <div>
      { '(not set)' }
    </div>
  : <div>
      <div><code>{ addr.slice(0, 14) }</code></div>
      <div><code>{ addr.slice(14, 28) }</code></div>
      <div><code>{ addr.slice(28) }</code></div>
    </div>

const renderNetworkKey = (hex) => {
  const sl = i => hex.slice(i, i + 4)
  const rowFrom = i => `${sl(i)}.${sl(i + 4)}.${sl(i + 8)}.${sl(i + 12)}`
  return (
      hex === NULL_KEY
    ? <div>
        { '(not set)' }
      </div>
    : <div>
        <div><code>{ hex.slice(0, 2) }</code></div>
        <div>
          <code>{ rowFrom(2) }</code>
        </div>
        <div>
          <code>{ rowFrom(18) }</code>
        </div>
        <div>
          <code>{ rowFrom(34) }</code>
        </div>
        <div>
          <code>{ rowFrom(50) }</code>
        </div>
      </div>
  )
}

const KeysAndMetadata = (props) => {
  const { pointDetails } = props

  return (
    <Row>
      <Col>
          <H2>{ 'Ownership and Proxy Addresses' }</H2>

      <Row>
        <Col className={'flex flex-column items-start col-md-3'}>
          <H4>{ 'Owner' }</H4>
          {
            pointDetails.matchWith({
              Nothing: () => <div />,
              Just: (deets) => renderAddress(deets.value.owner)
            })
          }
        </Col>


        <Col className={'flex flex-column items-start col-md-3'}>
          <H4>{ 'Transfer Proxy' }</H4>
          {
            pointDetails.matchWith({
              Nothing: () => <div />,
              Just: (deets) => renderAddress(deets.value.transferProxy)
            })
          }
        </Col>


        <Col className={'flex flex-column items-start col-md-3'}>
          <H4>{ 'Spawn Proxy' }</H4>
          {
            pointDetails.matchWith({
              Nothing: () => <div />,
              Just: (deets) => renderAddress(deets.value.spawnProxy)
            })
          }
        </Col>


        <Col className={'flex flex-column items-start col-md-3'}>
          <H4>{ 'Mgmt Proxy' }</H4>
          {
            pointDetails.matchWith({
              Nothing: () => <div />,
              Just: (deets) => renderAddress(deets.value.managementProxy)
            })
          }
        </Col>
      </Row>


      <UrbitNetworking pointDetails={ pointDetails } />


      </Col>
    </Row>
  )
}

const UrbitNetworking = props => {
  const { pointDetails } = props

  const booted = pointDetails.matchWith({
    Nothing: _ => false,
    Just: (details) => details.value.keyRevisionNumber > 0
  })

  const body =
      !booted
    ? <div>
        { '(not set)' }
      </div>
    : <Row>
        <Col className={'flex flex-column items-start col-md-4'}>
          <H4>{ 'Authentication' }</H4>
          {
            pointDetails.matchWith({
              Nothing: () => <div />,
              Just: (deets) =>
                renderNetworkKey(deets.value.authenticationKey)
            })
          }
        </Col>

        <Col className={'flex flex-column items-start col-md-4'}>
          <H4>{ 'Encryption' }</H4>
          {
            pointDetails.matchWith({
              Nothing: () => <div />,
              Just: (deets) =>
                renderNetworkKey(deets.value.encryptionKey)
            })
          }
        </Col>

        <Col className={'flex flex-column items-start col-md-4'}>
          <H4>{ 'Revision' }</H4>
          {
            pointDetails.matchWith({
              Nothing: () => '-',
              Just: (deets) => deets.value.keyRevisionNumber
            })
          }


          <H4>{ 'Continuity era' }</H4>
          {
            pointDetails.matchWith({
              Nothing: () => '-',
              Just: (deets) => deets.value.continuityNumber
            })
          }

          <H4>{ 'Crypto suite version' }</H4>
          {
            pointDetails.matchWith({
              Nothing: () => '-',
              Just: (deets) => deets.value.cryptoSuiteVersion
            })
          }
        </Col>
      </Row>

  return (
    <div>
      <H2>{ 'Urbit Networking' }</H2>

      { body }
    </div>
  )
}

export default KeysAndMetadata
