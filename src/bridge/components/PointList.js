import React from 'react';
import { chunk } from 'lodash';

import { Row } from './Base';
import RenderedPoint from './RenderedPoint';

const PointList = props => {
  const { setPointCursor, routeHandler, points, loading } = props;
  const chunks = chunk(points, 3);

  return points.length === 0 ? (
    <p>{loading ? 'Loading...' : 'No points to display'}</p>
  ) : (
    chunks.map((chunk, idx) => (
      <Row key={`render-row-${idx}`}>
        {chunk.map(point => (
          <RenderedPoint
            key={point}
            setPointCursor={setPointCursor}
            routeHandler={routeHandler}
            point={point}
          />
        ))}
      </Row>
    ))
  );
};

export default PointList;
