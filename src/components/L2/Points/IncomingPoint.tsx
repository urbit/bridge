import React, { useEffect, useState } from 'react';
import * as ob from 'urbit-ob';
import { Box } from '@tlon/indigo-react';

import LayerIndicator from '../LayerIndicator';
import './IncomingPoint.scss';
import useRoller from 'lib/useRoller';

export interface IncomingPointProps {
  point: number;
  accept: () => void;
  reject: () => void;
}

const IncomingPoint = ({ point, accept, reject }: IncomingPointProps) => {
  const { api } = useRoller();
  const [layer, setLayer] = useState<1 | 2>(1);

  useEffect(() => {
    api.getPoint(point).then(p => {
      setLayer(p.dominion === 'l2' ? 2 : 1);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
        <LayerIndicator layer={layer} size="sm" />
        <Box className="date"></Box>
      </Box>
    </Box>
  );
};

export default IncomingPoint;
