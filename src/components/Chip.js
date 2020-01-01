import React from 'react';
import cn from 'classnames';

export default function Chip({ children, color, className }) {
  const bgColor = `bg-${color}1`;
  const fgColor = `${color}4`;
  return (
    <div
      className={cn(
        className,
        'h6 r-full flex-center ph2 mh2',
        bgColor,
        fgColor
      )}>
      {children}
    </div>
  );
}
