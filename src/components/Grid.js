import React from 'react';
import cn from 'classnames';

function Grid({ className, ...rest }) {
  return <div className={cn('grid12', className)} {...rest} />;
}

Grid.Item = function GridItem({
  full,
  half,
  third,
  fourth,
  className,
  ...rest
}) {
  return (
    <div
      className={cn(
        full && `full`,
        half && `half-${half}`,
        third && `third-${third}`,
        fourth && `fourth-${fourth}`,
        className
      )}
      {...rest}
    />
  );
};

export default Grid;
