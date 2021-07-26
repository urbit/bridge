import React from 'react';
import cn from 'classnames';
import { IconButton } from 'indigo-react';

export const MiniBackButton = ({ className, isExit = false, ...rest }) => {
  return (
    <IconButton className={cn('black', className)} {...rest}>
      {'<-'}
    </IconButton>
  );
};
