import React from 'react';
import cn from 'classnames';

export default function Chip({ children, bgColor, fgColor, className }) {
  return (
    <div
      className={cn(
        className,
        'h6 r-full flex-center ph2 mh2 f6',
        bgColor,
        fgColor
      )}>
      {children}
    </div>
  );
}
