import React from 'react';
import cn from 'classnames';

import CopiableWithTooltip from './CopiableWithTooltip';

export default function CopiableAddressWrap({ className, ...rest }) {
  return (
    <CopiableWithTooltip className={cn(className, 'mono', 'wrap')} {...rest} />
  );
}
