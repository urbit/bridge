import React from 'react';
import cn from 'classnames';

export default function Button({
  solid = false,
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
          'white bg-black bg-gray6-hover': solid,
          'black bg-gray1-hover': !solid,
        },
        className
      )}
      {...rest}>
      {children}
      <div className="ph4">{icon}</div>
    </a>
  );
}
