import React from 'react';
import cn from 'classnames';
import { IconButton } from 'indigo-react';

export default ({ className, isExit = false, ...rest }) => {
  return (
    <IconButton className={cn('black', className)} {...rest}>
      {'<-'}
    </IconButton>
  );
};
