import React from 'react';
import cn from 'classnames';

import CopiableWithTooltip from './CopiableWithTooltip';

export default function CopiableAddress({ className, position, ...rest }) {
  return (
    <CopiableWithTooltip
      position={position}
      className={cn(className, 'mono', 'nowrap')}
      {...rest}
    />
  );
}
