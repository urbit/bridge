import React from 'react';
import { Box } from '@tlon/indigo-react';

import './BodyPane.scss';

export interface BodyPaneProps {
  children: React.ReactNode;
  className?: string;
}

const BodyPane = ({ children, className = '' }: BodyPaneProps) => {
  return <Box className={`body-pane ${className}`}>{children}</Box>;
};

export default BodyPane;
