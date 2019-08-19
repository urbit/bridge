import React from 'react';
import cn from 'classnames';

export default function Highlighted({
  as: As = 'span',
  className,
  warning = false,
  ...rest
}) {
  return (
    <As
      className={cn(
        {
          red3: warning,
          green3: !warning,
        },
        className
      )}
      {...rest}
    />
  );
}
