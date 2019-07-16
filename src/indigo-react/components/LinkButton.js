import React from 'react';
import cn from 'classnames';

export default function LinkButton({
  as: As = 'a',
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
        'pointer underline',
        {
          black: !disabled,
          gray4: disabled,
        },
        className
      )}
      {...rest}>
      {children}
    </span>
  );
}
