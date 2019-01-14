import React from 'react';
import PropTypes from 'prop-types';


const Form = ({
  className,
  children,
  style,
}) => {
  return (
    <form className={`${className}`} style={style}>
      { children }
    </form>
  )
};

Form.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
  style: PropTypes.object,
};

Form.defaultProps = {
  className: '',
  style: {},
};


export default Form;
