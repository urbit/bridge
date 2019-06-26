import React from 'react';
import cn from 'classnames';
import { IconButton } from 'indigo-react';

import { ReactComponent as Back } from 'assets/back.svg';

export default ({ className, ...rest }) => (
  <IconButton {...rest}>
    <Back className={cn('black', className)} />
  </IconButton>
);
