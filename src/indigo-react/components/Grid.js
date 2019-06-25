import React from 'react';
import cn from 'classnames';

import getComponent from '../lib/getComponent';

function Grid({ as = 'div', gap = 0, className, ...rest }) {
  const Component = getComponent(as);
  return (
    <Component
      className={cn('grid12', gap && `gap${gap}`, className)}
      {...rest}
    />
  );
}

Grid.Item = function GridItem({
  as = 'div',
  full = false,
  half = 0,
  third = 0,
  fourth = 0,
  rows = [],
  cols = [],
  justifySelf,
  alignSelf,
  className,
  ...rest
}) {
  const Component = getComponent(as);
  return (
    <Component
      className={cn(
        {
          full,
          [`half-${half}`]: half,
          [`third-${third}`]: third,
          [`fourth-${fourth}`]: fourth,
        },
        {
          [`r${rows[0]}-${rows[1]}`]: rows.length === 2,
          [`c${cols[0]}-${cols[1]}`]: cols.length === 2,
        },
        {
          [`justify-self-${justifySelf}`]: justifySelf,
          [`align-self-${alignSelf}`]: alignSelf,
        },
        className
      )}
      {...rest}
    />
  );
};

Grid.Divider = function GridDivider({ vertical = false, className, ...rest }) {
  return (
    <div
      style={{
        height: vertical ? 'auto' : '1px',
        width: vertical ? '1px' : 'auto',
      }}
      className={cn('full', className || 'bg-gray2')}
      {...rest}
    />
  );
};

export default Grid;
