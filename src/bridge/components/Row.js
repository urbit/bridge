import React from 'react';
import PropTypes from 'prop-types';

const Row = ({
  className,
  children,
  style,
}) => {
  return (
    <div className={`row ${className}`} style={style}>
      { children }
    </div>
  )
};

Row.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
  style: PropTypes.object,
};

Row.defaultProps = {
  className: '',
  style: {},
};


export default Row
