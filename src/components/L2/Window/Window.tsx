import React from 'react';
import { Box } from '@tlon/indigo-react';
import './Window.scss';

export interface WindowProps {
  children: React.ReactNode;
}

const Window = ({ children }: WindowProps) => {
  return <Box className="window">{children}</Box>;
};

export default Window;
