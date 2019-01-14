import React from 'react';
import PropTypes from 'prop-types'

const H4 = ({ className, children, style }) => {
  return (
    <h4 className={`mt-2 pt-1 mb-2 measure-md ${className}`} style={style}>
      { children }
    </h4>
  )
}


H4.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
  style: PropTypes.object,
};


H4.defaultProps = {
  className: '',
  style: {},
};


export default H4;
