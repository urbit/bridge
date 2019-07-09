import React from 'react';
import cn from 'classnames';

const Grid = React.forwardRef(function Grid(
  { as: As = 'div', gap = 0, align, justify, className, ...rest },
  ref
) {
  return (
    <As
      ref={ref}
      className={cn(
        'grid12',
        gap && `gap${gap}`,
        {
          [`justify-${justify}`]: justify,
          [`align-${align}`]: align,
        },
        className
      )}
      {...rest}
    />
  );
});

Grid.Item = React.forwardRef(function GridItem(
  {
    as: As = 'div',
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
  },
  ref
) {
  return (
    <As
      ref={ref}
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
});

Grid.Divider = function GridDivider({
  vertical = false,
  color = 'gray2',
  className,
  ...rest
}) {
  return (
    <div
      style={{
        height: vertical ? 'auto' : '1px',
        width: vertical ? '1px' : 'auto',
      }}
      className={cn('full', `bg-${color}`, className)}
      {...rest}
    />
  );
};

export default Grid;
