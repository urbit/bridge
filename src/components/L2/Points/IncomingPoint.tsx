import React from 'react';
import * as ob from 'urbit-ob';
import { Box } from '@tlon/indigo-react';

import LayerIndicator from '../LayerIndicator';
import './IncomingPoint.scss';

export interface IncomingPointProps {
  point: number;
  accept: () => void;
  reject: () => void;
}

const IncomingPoint = ({ point, accept, reject }: IncomingPointProps) => {
  return (
    <Box className="incoming-point" key={`incoming-${point}`}>
      <Box className="top">
        <Box className="title">Incoming Point: {ob.patp(point)}</Box>
        <Box className="button-row">
          <button className="accept" onClick={accept}>
            Accept
          </button>
          <button className="reject" onClick={reject}>
            Reject
          </button>
        </Box>
      </Box>
      <Box className="bottom">
        <LayerIndicator layer={1} size="sm" />
        <Box className="date"></Box>
      </Box>
    </Box>
  );
};

export default IncomingPoint;
