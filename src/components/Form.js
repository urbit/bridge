import React from 'react';
import PropTypes from 'prop-types';


const Form = (props) => {
  return (
    <form className={`measure-lg ${props.className}`} style={props.style}>
      { props.children }
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
