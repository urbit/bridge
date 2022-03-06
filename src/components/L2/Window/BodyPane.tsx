import React from 'react';
import { Box, BoxProps } from '@tlon/indigo-react';

import './BodyPane.scss';

export interface BodyPaneProps extends BoxProps {
  children: React.ReactNode;
  className?: string;
}

const BodyPane = ({
  children,
  className = '',
  color,
  ...props
}: BodyPaneProps) => {
  return (
    <Box
      className={`body-pane ${className}`}
      color={color as string & BoxProps['color']}
      p={3}
      {...props}>
      {children}
    </Box>
  );
};

export default BodyPane;
