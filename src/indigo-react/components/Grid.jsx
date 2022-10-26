import React from 'react';
import cn from 'classnames';

const Grid = React.forwardRef(function Grid(
  {
    as: As = 'div',
    gap = 0,
    asFlex = false,
    align,
    justify,
    className,
    ...rest
  },
  ref
) {
  return (
    <As
      ref={ref}
      className={cn(
        asFlex ? 'flex' : 'grid12',
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

Grid.Divider = function GridDivider({ color = 'gray2', className, ...rest }) {
  return <div className={cn('full', `bt1 b-${color}`, className)} {...rest} />;
};

export default Grid;
