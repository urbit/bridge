import React from 'react';

const Breadcrumb = ({ disabled, onClick, className, children }) => (
  <div className={`flex ${className}`} onClick={onClick} disabled={disabled}>
    {children}
  </div>
);

export default Breadcrumb;
