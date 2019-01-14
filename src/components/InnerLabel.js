import React from 'react';
import PropTypes from 'prop-types';


const InnerLabel = ({ children, className, style }) => {
  return (
    <div className={`abs tl-0 pt-2 pl-4 fs-3 text-500 sans ${className}`} style={style}>
      { children }
    </div>
  )
};


InnerLabel.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
  style: PropTypes.object,
};


InnerLabel.defaultProps = {
  className: '',
  style: {},
};

export default InnerLabel;
