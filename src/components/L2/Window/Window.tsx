import React from 'react';
import { Box } from '@tlon/indigo-react';
import './Window.scss';

export interface WindowProps {
  children: React.ReactNode;
  className?: string;
}

const Window = ({ children, className = '' }: WindowProps) => {
  return <Box className={`window ${className}`}>{children}</Box>;
};

export default Window;
