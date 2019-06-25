import React from 'react';
import cn from 'classnames';

import Flex from './Flex';

export default function IconButton({
  children,
  className,
  onClick,
  disabled = false,
  solid = false,
  ...rest
}) {
  return (
    <Flex
      as="a"
      align="center"
      justify="center"
      className={cn(
        'pointer p2',
        {
          'bg-black': solid && !disabled,
          'bg-gray3': !solid || disabled,
        },
        {
          white: solid,
          black: !solid && !disabled,
          gray4: !solid && disabled,
        },
        className
      )}
      style={{
        width: '1rem',
        height: '1rem',
        fontSize: '1rem',
        fontWeight: 'bold',
        // TODO: ^ replace with 1:1 svgs and remove explicit sizing
        ...(disabled && {
          pointerEvents: 'none',
          cursor: 'not-allowed',
        }),
      }}
      onClick={onClick ? () => !disabled && onClick() : undefined}
      {...rest}>
      {children}
    </Flex>
  );
}
