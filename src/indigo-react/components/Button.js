import React from 'react';
import cn from 'classnames';

import Grid from './Grid';
import Flex from './Flex';
import { HelpText } from './Typography';

export default function Button({
  as: As = 'a',
  solid = false,
  success = false,
  disabled = false,
  disabledDetail,
  detail,
  className,
  accessory = '→',
  onClick,
  children,
  ...rest
}) {
  return (
    <Grid
      as={As}
      gap={1}
      className={cn(
        'pointer pv4 truncate flex-row justify-between us-none',
        {
          p4: solid,
        },
        {
          'bg-green3': success && !disabled,
          'bg-green1': success && disabled,
          'bg-black': !success && solid && !disabled,
          'bg-gray3': !success && solid && disabled,
          'bg-transparent': !success && !solid,
        },
        {
          white: solid,
          black: !solid && !disabled,
          gray4: !solid && disabled,
        },
        className
      )}
      style={{
        ...(disabled && {
          pointerEvents: 'none',
          cursor: 'not-allowed',
        }),
      }}
      onClick={!disabled && onClick ? onClick : undefined}
      {...rest}>
      <Grid.Item full as={Flex} justify="between">
        <span>{children}</span>
        <div className={cn('pl4')}>{accessory}</div>
      </Grid.Item>
      {detail && (
        <Grid.Item full as={HelpText}>
          {detail}
        </Grid.Item>
      )}
      {disabled && disabledDetail && (
        <Grid.Item full className="f6 black mt1">
          {disabledDetail}
        </Grid.Item>
      )}
    </Grid>
  );
}
