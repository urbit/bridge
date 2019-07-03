import React from 'react';
import cn from 'classnames';

const Flex = React.forwardRef(function Flex(
  {
    as: As = 'div',
    row = false,
    wrap = false,
    col = false,
    align,
    justify,
    className,
    ...rest
  },
  ref
) {
  if (row && col) {
    throw new Error('Only one of row or col must be true, not both.');
  }
  return (
    <As
      ref={ref}
      className={cn(
        'flex',
        {
          'flex-row': row,
          'flex-col': col,
          'flex-wrap': wrap,
        },
        {
          [`align-${align}`]: align,
          [`justify-${justify}`]: justify,
        },
        className
      )}
      {...rest}
    />
  );
});

// flex can be boolean {true} or integer flex
Flex.Item = React.forwardRef(function FlexItem(
  { as: As = 'div', flex, className, ...rest },
  ref
) {
  if (flex === true) {
    flex = 1;
  }

  return (
    <As
      ref={ref}
      className={cn(
        {
          [`flex${flex}`]: flex,
        },
        className
      )}
      {...rest}
    />
  );
});

export default Flex;
