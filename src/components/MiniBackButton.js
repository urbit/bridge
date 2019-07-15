import React from 'react';
import cn from 'classnames';
import { IconButton } from 'indigo-react';

import { ReactComponent as Back } from 'assets/back.svg';

export default ({ className, ...rest }) => (
  <IconButton {...rest} flush>
    <Back className={cn('black', className)} />
  </IconButton>
);
