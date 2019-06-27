import React from 'react';
import cn from 'classnames';

function Flex({
  as: As = 'div',
  row = false,
  wrap = false,
  col = false,
  align,
  justify,
  className,
  ...rest
}) {
  if (row && col) {
    throw new Error('Only one of row or col must be true, not both.');
  }
  return (
    <As
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
}

// flex can be boolean {true} or integer flex
Flex.Item = function FlexItem({ as: As = 'div', flex, className, ...rest }) {
  if (flex === true) {
    flex = 1;
  }

  return (
    <As
      className={cn(
        {
          [`flex${flex}`]: flex,
        },
        className
      )}
      {...rest}
    />
  );
};

export default Flex;
