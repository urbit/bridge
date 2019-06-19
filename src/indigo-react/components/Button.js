import React from 'react';
import cn from 'classnames';

export default function Button({
  solid = false,
  disabled = false,
  className,
  icon,
  children,
  ...rest
}) {
  return (
    <a
      className={cn(
        'pointer pv3 pl4 pr0 truncate flex-row justify-between',
        {
          'white bg-black bg-gray6-hover': solid && !disabled,
          'white bg-gray3': solid && disabled,
          'black bg-transparent bg-gray1-hover': !solid && !disabled,
          'gray4 bg-transparent': !solid && disabled,
        },
        className
      )}
      style={{
        ...(disabled && { pointerEvents: 'none', cursor: 'not-allowed' }),
      }}
      {...rest}>
      {children}
      <div
        className={cn('ph4', {
          white: solid,
          black: !solid && !disabled,
          gray4: !solid && disabled,
        })}>
        {icon}
      </div>
    </a>
  );
}
