import React from 'react';
import PropTypes from 'prop-types';

const Col = ({ className, children, style }) => {
  return (
    <div className={`col- ${className}`} style={style}>
      {children}
    </div>
  );
};

Col.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
  style: PropTypes.object,
};

Col.defaultProps = {
  className: '',
  style: {},
};

export default Col;
