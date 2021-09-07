import React from 'react';
import { Box } from '@tlon/indigo-react';

import './HeaderPane.scss';

export interface HeaderPaneProps {
  children: React.ReactNode;
}

const HeaderPane = ({ children }: HeaderPaneProps) => {
  return <Box className="header-pane">{children}</Box>;
};

export default HeaderPane;
