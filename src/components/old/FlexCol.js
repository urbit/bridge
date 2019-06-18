import React from 'react';
import PropTypes from 'prop-types';

const FlexCol = ({ className, children, style }) => {
  return (
    <div className={`flex flex-column flex-1 ${className}`} style={style}>
      {children}
    </div>
  );
};

FlexCol.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
  style: PropTypes.object,
};

FlexCol.defaultProps = {
  className: '',
  style: {},
};

export default FlexCol;
