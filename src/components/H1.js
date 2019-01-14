import React from 'react';
import PropTypes from 'prop-types'

const H1 = ({ className, children, style }) => {
  return (
    <h1 className={`mt-12 pt-6 mb-4 text-700 measure-md ${className}`} style={style}>
      { children }
    </h1>
  )
}


H1.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
  style: PropTypes.object,
};


H1.defaultProps = {
  className: '',
  style: {},
};


export default H1;
