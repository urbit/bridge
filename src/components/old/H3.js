import React from 'react';
import PropTypes from 'prop-types';

const H3 = ({ className, children, style }) => {
  return (
    <h3 className={`mt-8 pt-3 mb-4 measure-md ${className}`} style={style}>
      {children}
    </h3>
  );
};

H3.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
  style: PropTypes.object,
};

H3.defaultProps = {
  className: '',
  style: {},
};

export default H3;
