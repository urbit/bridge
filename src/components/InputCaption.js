import React from 'react';
import PropTypes from 'prop-types';


const InputCaption = ({ children, className, style }) => {
  return (
    <div className={`mt-8 mb-1 text-35 text-400 sans ${className}`} style={style}>
      { children }
    </div>
  )
};


InputCaption.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
  style: PropTypes.object,
};


InputCaption.defaultProps = {
  className: '',
  style: {},
};

export default InputCaption;
