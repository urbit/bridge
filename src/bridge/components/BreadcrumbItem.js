import React from 'react';

const BreadcrumbItem = ({ disabled, onClick, className, children }) => (
  <div className={`${className}`} onClick={onClick} disabled={disabled}>
    {children}
  </div>
);

export default BreadcrumbItem;
