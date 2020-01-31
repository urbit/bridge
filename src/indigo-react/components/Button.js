import React from 'react';
import cn from 'classnames';

import Grid from './Grid';
import Flex from './Flex';
import { HelpText } from './Typography';

export default function Button({
  as: As = 'span',
  solid = false,
  success = false,
  disabled = false,
  disabledDetail,
  detail,
  className,
  detailClassName,
  accessory = '→',
  onClick,
  background,
  type,
  children,
  center = false,
  ...rest
}) {
  const handleKeyPress = e => {
    if (e.key === 'Enter' && !disabled) {
      onClick();
    }
  };
  return (
    <Grid
      as={As}
      gap={1}
      tabIndex={!disabled ? 0 : undefined}
      onKeyPress={handleKeyPress}
      className={cn(
        'rel pointer pv4 truncate flex-row justify-between us-none',
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
      {background}
      <Grid.Item
        full
        as={Flex}
        justify="between"
        className={cn('z2', { 'flex-center': center })}>
        <span>{children}</span>
        {type && <button type={type} style={{ display: 'none' }}></button>}
        {!center && <div className={cn('pl4')}>{accessory}</div>}
      </Grid.Item>
      {detail && (
        <Grid.Item full as={HelpText} className={cn('z2', detailClassName)}>
          {detail}
        </Grid.Item>
      )}
      {disabled && disabledDetail && (
        <Grid.Item full className="f6 black mt1 z2">
          {disabledDetail}
        </Grid.Item>
      )}
    </Grid>
  );
}
