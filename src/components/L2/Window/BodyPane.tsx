import React from 'react';
import { Box } from '@tlon/indigo-react';

import './BodyPane.scss';

export interface BodyPaneProps {
  children: React.ReactNode;
}

const BodyPane = ({ children }: BodyPaneProps) => {
  return <Box className="body-pane">{children}</Box>;
};

export default BodyPane;
