import React from 'react';

import './LayerIndicator.scss';

export interface LayerIndicatorProps {
  layer: 1 | 2;
  size: 'sm' | 'md';
}

const LayerIndicator = ({ layer, size }: LayerIndicatorProps) => {
  return <div className={`layer-indicator ${size} l${layer}`}>L{layer}</div>;
};

export default LayerIndicator;
