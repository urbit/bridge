import React from 'react';
import { Box } from '@tlon/indigo-react';
import { PermissionLevel, shouldDisplayPermissionLevel } from 'lib/types/Point';

import './PermissionIndicator.scss';

export interface PermissionIndicatorProps {
  permission: PermissionLevel;
  size?: 'sm' | 'smt' | 'md' | 'lg';
  className?: string;
  selected?: boolean;
}

const permissionText = {
  own: 'OWN',
  manage: 'MGMT',
  spawn: 'SPWN',
  vote: 'VOTE',
  transfer: 'TSFR',
};

const PermissionIndicator = ({
  permission,
  className = '',
}: PermissionIndicatorProps) => {
  const classes = `permission-indicator ${permission} ${className}`;

  if (!permission || !shouldDisplayPermissionLevel(permission)) {
    return null;
  }

  return <Box className={classes}>{permissionText[permission]}</Box>;
};

export default PermissionIndicator;
