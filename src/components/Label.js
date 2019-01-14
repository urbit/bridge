import React from 'react';
import PropTypes from 'prop-types';


const Label = ({ children, className }) => {
  return (
    <div className={`mb-1 mt-8 fs-4 text-600 sans ${className}`}>
      { children }
    </div>
  )
};


Label.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
  style: PropTypes.object,
};


Label.defaultProps = {
  className: '',
  style: {},
};

export default Label;
