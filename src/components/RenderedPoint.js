import Maybe from 'folktale/maybe'
import React from 'react'
import { Col } from './Base'
import { Button } from './Base'
import { pour } from 'sigil-js'
import * as ob from 'urbit-ob'

import { ROUTE_NAMES } from '../lib/router'
import ReactSVGComponents from './ReactSVGComponents'

const RenderedPoint = (props) => {
  const { setPointCursor, routeHandler, point } = props

  const name = ob.patp(point)
  const sigil = pour({
    patp: name,
    renderer: ReactSVGComponents,
    size: 128
  })

  return (
    <Col className={'col-md-3 mb-8'} key={ `rendered-${point}` }>
      <div key={ `rendered-sigil-${point}` }>
        { sigil }
      </div>
      <div key={ `rendered-name-${point}` }>
        <code>{ name }</code>
      </div>
      <div key={ `rendered-deets-${point}` }>
        <Button
          key={ `rendered-deets-button-${point}` }
          prop-type={'link'}
          prop-size={'sm'}
          onClick={ () => {
            setPointCursor(Maybe.Just(point))
            routeHandler(ROUTE_NAMES.SHIP)
          }}
        >
          { 'Details →' }
        </Button>
      </div>
    </Col>
  )
}

export default RenderedPoint
