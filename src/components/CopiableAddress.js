import React from 'react';
import cn from 'classnames';

import CopiableWithTooltip from './CopiableWithTooltip';

export default function CopiableAddress({ className, ...rest }) {
  return <CopiableWithTooltip className={cn(className, 'mono')} {...rest} />;
}
