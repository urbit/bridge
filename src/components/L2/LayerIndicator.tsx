import React from 'react';
import { Box } from '@tlon/indigo-react';

import './LayerIndicator.scss';

export interface LayerIndicatorProps {
  layer: 1 | 2;
  size?: 'sm' | 'smt' | 'md' | 'lg';
  className?: string;
  selected?: boolean;
}

const LayerIndicator = ({
  layer,
  size = 'md',
  className = '',
  selected = false,
}: LayerIndicatorProps) => {
  const classes = `layer-indicator ${size} l${layer} ${className} ${
    selected ? 'selected' : ''
  }`;

  return <Box className={classes}>L{layer}</Box>;
};

export default LayerIndicator;
