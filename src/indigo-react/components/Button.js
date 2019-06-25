import React from 'react';
import cn from 'classnames';

import Grid from './Grid';
import Flex from './Flex';
import { HelpText } from './Typography';

export default function Button({
  solid = false,
  disabled = false,
  detail,
  className,
  accessory = '→',
  onClick,
  children,
  ...rest
}) {
  const textColor = {
    white: solid,
    black: !solid && !disabled,
    gray4: !solid && disabled,
  };
  return (
    <Grid
      as="a"
      gap={4}
      className={cn(
        'pointer pv4 truncate flex-row justify-between',
        {
          p4: solid,
        },
        {
          'bg-black': solid && !disabled,
          'bg-gray3': solid && disabled,
          'bg-transparent': !solid,
        },
        className
      )}
      style={{
        ...(disabled && {
          pointerEvents: 'none',
          cursor: 'not-allowed',
        }),
      }}
      onClick={onClick ? () => !disabled && onClick() : undefined}
      {...rest}>
      <Grid.Item as={Flex} justify="between" full>
        <span className={cn(textColor)}>{children}</span>
        <div className={cn('pl4', textColor)}>{accessory}</div>
      </Grid.Item>
      {detail && (
        <Grid.Item as={HelpText} full>
          {detail}
        </Grid.Item>
      )}
    </Grid>
  );
}
