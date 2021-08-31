import React from 'react';

import './BodyPane.scss';

export interface BodyPaneProps {}

const BodyPane = ({ children }: any) => {
  return <div className="body-pane">{children}</div>;
};

export default BodyPane;
