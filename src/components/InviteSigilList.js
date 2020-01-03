import React from 'react';
import cn from 'classnames';
import { Just, Nothing } from 'folktale/maybe';
import * as ob from 'urbit-ob';
import { take } from 'lodash';

import MaybeSigil from 'components/MaybeSigil';

const InviteSigilList = ({ className, pendingPoints, acceptedPoints }) => {
  const _acceptedPoints = take(
    acceptedPoints.getOrElse([]).map(x => Just(ob.patp(x))),
    6
  );

  const _pendingPoints = take(
    pendingPoints.getOrElse([]).map(x => Just(ob.patp(x))),
    6 - _acceptedPoints.length
  );

  const empty = [
    ...Array(
      Math.max(6 - _acceptedPoints.length - _pendingPoints.length, 0)
    ).keys(),
  ].map(() => Nothing());

  const renderSigil = (points, colors, klassName) => {
    return (
      <>
        {points.map((point, idx) => (
          <div key={idx} className={cn(klassName, 'h9 w9')}>
            <MaybeSigil patp={point} size={50} colors={colors} />
          </div>
        ))}
      </>
    );
  };

  return (
    <div className={cn('flex justify-between', className)}>
      {renderSigil(_acceptedPoints, ['#000000', '#FFFFFF'])}
      {renderSigil(_pendingPoints, ['#ee892b', '#FFFFFF'])}
      {renderSigil(empty, [], 'b1 b-black b-dashed')}
    </div>
  );
};

export default InviteSigilList;
