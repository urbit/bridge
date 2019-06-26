import React from 'react';
import cn from 'classnames';

import { ReactComponent as Back } from 'assets/back.svg';
import { IconButton } from 'indigo-react';

export default ({ className, ...rest }) => (
  <IconButton {...rest}>
    <Back className={cn('black', className)} />
  </IconButton>
);
