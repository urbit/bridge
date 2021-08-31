import React from 'react';
import * as ob from 'urbit-ob';

import LayerIndicator from '../LayerIndicator';
import './IncomingPoint.scss';

export interface IncomingPointProps {
  point: number;
  accept: () => void;
  reject: () => void;
}

const IncomingPoint = ({ point, accept, reject }: IncomingPointProps) => {
  return (
    <div className="incoming-point" key={`incoming-${point}`}>
      <div className="top">
        <div className="title">Incoming Point: {ob.patp(point)}</div>
        <div className="button-row">
          <button className="accept" onClick={accept}>
            Accept
          </button>
          <button className="reject" onClick={reject}>
            Reject
          </button>
        </div>
      </div>
      <div className="bottom">
        <LayerIndicator layer={1} size="sm" />
        <div className="date"></div>
      </div>
    </div>
  );
};

export default IncomingPoint;
