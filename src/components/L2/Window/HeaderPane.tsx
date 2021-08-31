import React from 'react';

import './HeaderPane.scss';

export interface HeaderPaneProps {}

const HeaderPane = ({ children }: any) => {
  return <div className="header-pane">{children}</div>;
};

export default HeaderPane;
