import React from 'react';
import { Box } from '@tlon/indigo-react';

import './LayerIndicator.scss';

export interface LayerIndicatorProps {
  layer: 1 | 2;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const LayerIndicator = ({
  layer,
  size = 'md',
  className = '',
}: LayerIndicatorProps) => {
  return (
    <Box className={`layer-indicator ${size} l${layer} ${className}`}>
      L{layer}
    </Box>
  );
};

export default LayerIndicator;
