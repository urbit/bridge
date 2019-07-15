import React from 'react';
import cn from 'classnames';

export default function LinkButton({
  as: As = 'a',
  solid = false,
  disabled = false,
  className,
  onClick,
  children,
  ...rest
}) {
  return (
    <span
      onClick={!disabled && onClick ? onClick : undefined}
      style={{
        ...(disabled && {
          pointerEvents: 'none',
          cursor: 'not-allowed',
        }),
      }}
      className={cn(
        'pointer ph2 underline',
        {
          white: solid,
          black: !solid && !disabled,
          gray4: !solid && disabled,
        },
        className
      )}
      {...rest}>
      {children}
    </span>
  );
}
