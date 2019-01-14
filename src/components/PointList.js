import React from 'react'
import * as lodash from 'lodash'
import { Row } from './Base'
import RenderedPoint from './RenderedPoint'

const PointList = props => {
  const { setPointCursor, routeHandler, points } = props
  const chunks = lodash.chunk(points, 3)

  return (
     points.length === 0
      ? <p>{'No points to display'}</p>
      : lodash.map(chunks, (chunk, idx) =>
        <Row key={ `render-row-${idx}` }>
          {
            lodash.map(chunk, point =>
              <RenderedPoint
                setPointCursor={ setPointCursor }
                routeHandler={ routeHandler }
                point={ point }
              />
            )
          }
        </Row>
      )
    
)
}

export default PointList
