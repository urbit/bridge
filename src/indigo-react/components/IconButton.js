import React from 'react';
import cn from 'classnames';

import Flex from './Flex';

export default function IconButton({
  children,
  className,
  onClick,
  disabled = false,
  secondary = false,
  solid = false,
  flush = false, // if true, remove horizontal padding
  ...rest
}) {
  return (
    <Flex
      as="a"
      align="center"
      justify="center"
      className={cn(
        'pointer pv2',
        {
          ph2: !flush,
        },
        {
          'bg-black': solid && !secondary && !disabled,
          'bg-gray3': (solid && disabled) || (solid && secondary),
          'bg-gray2': !solid && secondary && disabled,
          'bg-transparent': !solid,
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
