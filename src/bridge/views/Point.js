import Maybe from 'folktale/maybe'
import React from 'react'
import { pour } from 'sigil-js'
import * as ob from 'urbit-ob'
import * as azimuth from 'azimuth-js'

import PointList from '../components/PointList'
import ReactSVGComponents from '../components/ReactSVGComponents'
import KeysAndMetadata from './Point/KeysAndMetadata'
import Actions from './Point/Actions'
import { BRIDGE_ERROR } from '../lib/error'
import { Row, Col, H1,  H3 } from '../components/Base'


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

    const authenticated = Maybe.Just.hasInstance(wallet)

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



    return (
        <Row>
          <Col>
            <div className={'mt-12 pt-6'}>
              { sigil }
            </div>
            <H1><code>{ name }</code></H1>
            {
              authenticated
              ? <Actions pushRoute={ pushRoute } online={ online } point={ point } pointDetails={ pointDetails } wallet={ wallet }/>
              : null
            }

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
