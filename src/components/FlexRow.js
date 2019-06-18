import React from 'react';
import PropTypes from 'prop-types';

const FlexRow = ({ className, children }) => {
  return <div className={`flex ${className}`}>{children}</div>;
};

FlexRow.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
};

FlexRow.defaultProps = {
  className: '',
};

export default FlexRow;
