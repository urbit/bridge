import React from 'react';
import PropTypes from 'prop-types';

const Warning = ({ className, children, style, measure }) => {
  return (
    <div className={`mb-7 p-4 bg-yellow break-word ${className}`} style={style}>
      {children}
    </div>
  );
};

Warning.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
  style: PropTypes.object,
};

Warning.defaultProps = {
  className: '',
  style: {},
};

export default Warning;
