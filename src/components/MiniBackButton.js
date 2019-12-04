import React from 'react';
import cn from 'classnames';
import { IconButton } from 'indigo-react-local';

import { ReactComponent as Back } from 'assets/back.svg';

export default ({ className, isExit = false, ...rest }) => {
  return (
    <IconButton {...rest}>
      {isExit ? '⏏' : <Back className={cn('black', className)} />}
    </IconButton>
  );
};
