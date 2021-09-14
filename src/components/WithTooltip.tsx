import React, { useState, useCallback } from 'react';
import { useMemo } from 'react';

export enum TooltipPosition {
  Top,
  TopRight,
  Left,
  // Add more as necessary here and in #positionStyle
}

type WithTooltipArgs = {
  content: string;
  children: React.ReactNode;
  className?: string | undefined;
  position?: TooltipPosition;
};

export default function WithTooltip({
  content,
  children,
  className,
  position = TooltipPosition.Top,
}: WithTooltipArgs) {
  const [isHovered, setHovered] = useState(false);
  const onMouseEnter = useCallback(() => setHovered(true), []);
  const onMouseLeave = useCallback(() => setHovered(false), []);

  const positionStyle = useMemo(() => {
    switch (position) {
      case TooltipPosition.Top:
        return { bottom: '100%' };
      case TooltipPosition.TopRight:
        return { bottom: '90%', left: '90%' };
      case TooltipPosition.Left:
        return { bottom: '-67%', left: '-400%' };
      default:
        return { bottom: '100%' };
    }
  }, [position]);

  return (
    <div
      className={className || 'rel nowrap inline-block'}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}>
      {children}
      {isHovered && (
        <div
          className="abs mb1 bg-black white ph4 pv2 r4 open-tooltip"
          style={positionStyle}>
          {content}
        </div>
      )}
    </div>
  );
}
