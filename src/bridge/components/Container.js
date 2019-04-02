import React from 'react';
import PropTypes from 'prop-types';


const Container = ({
  className,
  children,
  style,
}) => {
  return (
    <main className={`container ${className}`} style={style}>
      { children }
    </main>
  )
};

Container.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
  style: PropTypes.object,
};

Container.defaultProps = {
  className: '',
  style: {},
};


export default Container;
