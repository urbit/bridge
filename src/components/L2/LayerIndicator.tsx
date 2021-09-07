import React from 'react';
import { Box } from '@tlon/indigo-react';

import './LayerIndicator.scss';

export interface LayerIndicatorProps {
  layer: 1 | 2;
  size: 'sm' | 'md';
}

const LayerIndicator = ({ layer, size }: LayerIndicatorProps) => {
  return <Box className={`layer-indicator ${size} l${layer}`}>L{layer}</Box>;
};

export default LayerIndicator;
