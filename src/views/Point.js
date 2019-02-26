import Maybe from 'folktale/maybe'
import React from 'react'
import { pour } from 'sigil-js'
import * as ob from 'urbit-ob'
import * as azimuth from 'azimuth-js'

import PointList from '../components/PointList'
import ReactSVGComponents from '../components/ReactSVGComponents'
import KeysAndMetadata from './Point/KeysAndMetadata'
import { BRIDGE_ERROR } from '../lib/error'
import { ROUTE_NAMES } from '../lib/router'
import { Row, Col, H1, H2, H3, P } from '../components/Base'
import { Button } from '../components/Base'
import {
  ETH_ZERO_ADDR,
  CURVE_ZERO_ADDR,
  addressFromSecp256k1Public,
  eqAddr
  } from '../lib/wallet'

const isPlanet = point =>
  parseInt(point, 10) > 65535

class Point extends React.Component {

  constructor(props) {
    super(props)

    this.state = {
      spawned: []
    }
  }

  componentDidMount() {
    this.cachePoints()
  }

  componentDidUpdate(prevProps) {
    //
    // NB (jtobin)
    //
    // When a link in the 'issued points' component is clicked, we don't
    // actually leave the Point component, and componentDidMount will not fire
    // again.  But, we can force a call to cachePoints here.
    //
    const oldCursor = prevProps.pointCursor.getOrElse(true)
    const newCursor = this.props.pointCursor.getOrElse(true)

    if (oldCursor !== newCursor) {
      this.cachePoints()
    }
  }

  cachePoints() {
    const { web3, contracts, pointCursor, addToPointCache } = this.props

    web3.chain(_ =>
    contracts.chain(ctrcs =>
    pointCursor.chain(point => {
      azimuth.azimuth.getPoint(ctrcs, point)
      .then(details => addToPointCache({ [point]: details }))
      this.updateSpawned(ctrcs, point)
    })))
  }

  updateSpawned = contracts => {
    const { pointCursor } = this.props

    pointCursor.matchWith({
      Nothing: _ => {},
      Just: point => {
        azimuth.azimuth.getSpawned(contracts, point.value)
        .then(spawned => this.setState({ spawned }))
      }
    })

  }

  render() {

    const { web3, popRoute, pushRoute, wallet } = this.props
    const { setPointCursor } = this.props
    const { pointCursor, pointCache } = this.props

    const { spawned } = this.state

    const addr = wallet.matchWith({
      Just: (wal) => addressFromSecp256k1Public(wal.value.publicKey),
      Nothing: () => {
        throw BRIDGE_ERROR.MISSING_WALLET
      }
    })

    const point = pointCursor.matchWith({
      Just: (cursor) => cursor.value,
      Nothing: () => {
        throw BRIDGE_ERROR.MISSING_POINT
      }
    })

    const pointDetails =
        point in pointCache
      ? Maybe.Just(pointCache[point])
      : Maybe.Nothing()

    const name = ob.patp(point)

    const sigil = pour({
      patp: name,
      renderer: ReactSVGComponents,
      size: 256
    })

    const online = Maybe.Just.hasInstance(web3)

    const canSetTransferProxy = pointDetails.matchWith({
      // also should check is addr is operator
      Nothing: _ => false,
      Just: details => eqAddr(details.value.owner, addr)
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

    const routeHandler = route => {
      popRoute()
      pushRoute(route)
    }

    const issuedPointList =
        spawned.length === 0
      ? <div />
      : <div>
          <H3>{ 'Issued Points' }</H3>

          <PointList
            setPointCursor={ setPointCursor }
            routeHandler={ routeHandler }
            points={ spawned }
          />
        </div>


    const displayReminder = pointDetails.matchWith({
      Nothing: () => false,
      Just: (deets) => {
        return deets.value.encryptionKey === CURVE_ZERO_ADDR
          && deets.value.authenticationKey === CURVE_ZERO_ADDR
      }
    })

    return (
        <Row>
          <Col>

            <div className={'mt-12 pt-6'}>
              { sigil }
            </div>

            <H1><code>{ name }</code></H1>

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
                disabled={ online && !canSetTransferProxy }
                prop-size={'sm'}
                prop-type={'link'}
                onClick={ () => {
                  pushRoute(ROUTE_NAMES.SET_TRANSFER_PROXY)
                }}
              >
                { 'Set transfer proxy' }
              </Button>

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

              </Col>

              <Col className={'flex flex-column items-start col-md-4'}>

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



          {
              online
            ? <KeysAndMetadata pointDetails={ pointDetails } />
            : <div />
          }



        { issuedPointList }

        </Col>
      </Row>
    )
  }
}

export default Point
