import React from 'react';
import cn from 'classnames';

// progrss is [0, 1]
export default function LoadingBar({ className, progress = 1 }) {
  return (
    <div className={cn('rel bg-gray2', className)} style={{ height: '4px' }}>
      <div
        className="abs bg-green3"
        style={{
          top: 0,
          bottom: 0,
          left: 0,
          width: `${progress * 100.0}%`,
        }}
      />
    </div>
  );
}
