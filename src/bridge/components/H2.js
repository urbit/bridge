import React from 'react';
import PropTypes from 'prop-types';

const H2 = ({ className, children, style }) => {
  return (
    <h2 className={`mt-8 pt-3 mb-4 measure-md ${className}`} style={style}>
      {children}
    </h2>
  );
};

H2.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
  style: PropTypes.object,
};

H2.defaultProps = {
  className: '',
  style: {},
};

export default H2;
