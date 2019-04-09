import React from 'react'
import {
  ETH_ZERO_ADDR,
  CURVE_ZERO_ADDR,
  addressFromSecp256k1Public,
  eqAddr
} from '../../lib/wallet'
import { BRIDGE_ERROR } from '../../lib/error'
import { Row, Col, H2, P } from '../../components/Base'
import { Button } from '../../components/Base'
import { ROUTE_NAMES } from '../../lib/router'


const isPlanet = point =>
      parseInt(point, 10) > 65535

const Actions = (props) => {
  const { pushRoute, online, point, pointDetails, wallet } = props

  const addr = wallet.matchWith({
    Just: (wal) => addressFromSecp256k1Public(wal.value.publicKey),
    Nothing: () => {
      throw BRIDGE_ERROR.MISSING_WALLET
    }
  })

  const canSetSpawnProxy = pointDetails.matchWith({
    Nothing: _ => false,
    Just: details =>
      eqAddr(details.value.owner, addr) && details.value.active
  })

  const canSetManagementProxy = pointDetails.matchWith({
    Nothing: _ => false,
    Just: details =>
      eqAddr(details.value.owner, addr) && details.value.active
  })

  const canConfigureKeys = pointDetails.matchWith({
    Nothing: _ => false,
    Just: details => {
      const canManage =
            eqAddr(details.value.owner, addr)
            || eqAddr(details.value.managementProxy, addr)

      return canManage && details.value.active
    }
  })

  const canIssueChild =
        pointDetails.matchWith({
          Nothing: () => false,
          Just: (details) => {
            const hasPermission =
                  eqAddr(details.value.owner, addr)
                  || eqAddr(details.value.spawnProxy, addr)

            const isBooted =
                  details.value.keyRevisionNumber > 0

            const isNotPlanet = !isPlanet(point)

            return hasPermission && isBooted && isNotPlanet
          }
        })

  const planet = isPlanet(point)

  const canTransfer =
        pointDetails.matchWith({
          Nothing: () => false,
          Just: (deets) =>
            eqAddr(deets.value.transferProxy, addr) ||
            eqAddr(deets.value.owner, addr)
        })

  const canGenKeyfile =
        pointDetails.matchWith({
          Nothing: () => false,
          Just: (deets) => {
            const hasPermission =
                  eqAddr(deets.value.owner, addr)
                  || eqAddr(deets.value.managementProxy, addr)

            const isBooted =
                  deets.value.keyRevisionNumber > 0

            return hasPermission && isBooted
          }
        })

  const canAcceptTransfer =
        pointDetails.matchWith({
          Nothing: () => false,
          Just: (deets) =>
            eqAddr(deets.value.transferProxy, addr)
        })

  const canCancelTransfer =
        pointDetails.matchWith({
          Nothing: () => false,
          Just: (deets) =>
            eqAddr(deets.value.owner, addr) &&
            !eqAddr(deets.value.transferProxy, ETH_ZERO_ADDR)
        })

  const displayReminder = pointDetails.matchWith({
    Nothing: () => false,
    Just: (deets) => {
      return deets.value.encryptionKey === CURVE_ZERO_ADDR
        && deets.value.authenticationKey === CURVE_ZERO_ADDR
    }
  })

  return (
    <div>
      <H2>{ 'Actions' }</H2>
      {
        displayReminder
          ? <P>{`Before you can issue child points or generate your Arvo
                  keyfile, you need to set your public keys.`}</P>
        : ''
      }
      <Row>
        <Col className={'flex flex-column items-start col-md-4'}>
          <Button
            prop-size={'sm'}
            prop-type={'link'}
            disabled={ (online || planet) && !canIssueChild }
            onClick={ () => {
              pushRoute(ROUTE_NAMES.ISSUE_CHILD)
            }}
          >
            { 'Issue child' }
          </Button>

          <Button
            prop-size={'sm'}
            prop-type={'link'}
            disabled={ !canAcceptTransfer }
            onClick={ () => {
              pushRoute(ROUTE_NAMES.ACCEPT_TRANSFER)
            }}
          >
            { 'Accept incoming transfer' }
          </Button>

          <Button
            prop-size={'sm'}
            prop-type={'link'}
            disabled={ online && !canCancelTransfer }
            onClick={ () => {
              pushRoute(ROUTE_NAMES.CANCEL_TRANSFER)
            }}
          >
            { 'Cancel outgoing transfer' }
          </Button>

          <Button
            prop-size={'sm'}
            prop-type={'link'}
            disabled={ !canGenKeyfile }
            onClick={ () => {
              pushRoute(ROUTE_NAMES.GEN_KEYFILE)
            }}
          >
            { 'Generate Arvo keyfile' }
          </Button>

        </Col>
        <Col className={'flex flex-column items-start col-md-4'}>

          <Button
            disabled={ online && !canSetSpawnProxy }
            prop-size={'sm'}
            prop-type={'link'}
            onClick={ () => {
              pushRoute(ROUTE_NAMES.SET_SPAWN_PROXY)
            }}
          >
            { 'Set spawn proxy' }
          </Button>

          <Button
            disabled={ online && !canSetManagementProxy }
            prop-size={'sm'}
            prop-type={'link'}
            onClick={ () => {
              pushRoute(ROUTE_NAMES.SET_MANAGEMENT_PROXY)
            }}
          >
            { 'Set management proxy' }
          </Button>

          <Button
            disabled={ online && !canConfigureKeys }
            prop-size={'sm'}
            prop-type={'link'}
            onClick={ () => {
              pushRoute(ROUTE_NAMES.SET_KEYS)
            }}
          >
            { 'Set public keys' }
          </Button>

          <Button
            disabled={ online && !canTransfer }
            prop-size={'sm'}
            prop-type={'link'}
            onClick={ () => {
              pushRoute(ROUTE_NAMES.TRANSFER)
            }}
          >
            { 'Transfer' }
          </Button>

        </Col>
      </Row>
    </div>
  )
}

export default Actions
