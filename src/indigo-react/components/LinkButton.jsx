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
    <As
      onClick={!disabled && onClick ? onClick : undefined}
      style={{
        ...(disabled && {
          pointerEvents: 'none',
          cursor: 'not-allowed',
        }),
      }}
      className={cn(
        'us-none pointer underline',
        {
          // NOTE: inherit styling from parent otherwise
          gray4: disabled,
        },
        className
      )}
      target="_blank"
      rel="noopener noreferrer"
      {...rest}>
      {children}
    </As>
  );
}
