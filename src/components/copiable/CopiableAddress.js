import React from 'react';
import cn from 'classnames';

import CopiableWithTooltip from './CopiableWithTooltip';
import { TooltipPosition } from 'components/WithTooltip';

export default function CopiableAddress({
  className = '',
  position = TooltipPosition.Top,
  ...rest
}) {
  return (
    <CopiableWithTooltip
      position={position}
      className={cn(className, 'mono', 'nowrap')}
      {...rest}
    />
  );
}
