import React from 'react';
import cn from 'classnames';

import { ReactComponent as Back } from 'assets/back.svg';

export default ({ className, ...rest }) => (
  <Back className={cn('black pointer', className)} {...rest} />
);
