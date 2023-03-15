import React from 'react';
import cn from 'classnames';
import { Icon } from '@tlon/indigo-react';
import { IconButton } from 'indigo-react';

import './MiniBackButton.scss';

export const MiniBackButton = ({ className, isExit = false, ...rest }) => {
  return (
    <IconButton className={cn('black', className)} {...rest}>
      <Icon icon="ChevronWest" className="back-button" />
    </IconButton>
  );
};
