import React from 'react';
import './Window.scss';

export interface WindowProps {}

const Window = ({ children }: any) => {
  return <div className="window">{children}</div>;
};

export default Window;
