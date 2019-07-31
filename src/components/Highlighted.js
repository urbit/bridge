import React from 'react';
import cn from 'classnames';

export default function Highlighted({ warning = false, ...rest }) {
  return (
    <span
      className={cn({
        red3: warning,
        green3: !warning,
      })}
      {...rest}
    />
  );
}
