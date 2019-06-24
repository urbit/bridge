import React from 'react';
import cn from 'classnames';

import getComponent from 'indigo-react/lib/getComponent';

function Flex({
  as = 'div',
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

  const Component = getComponent(as);
  return (
    <Component
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
Flex.Item = function FlexItem({ as = 'div', flex, className, ...rest }) {
  if (flex === true) {
    flex = 1;
  }

  const Component = getComponent(as);
  return (
    <Component
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
