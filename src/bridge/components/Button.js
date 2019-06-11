import React from 'react';
import PropTypes from 'prop-types';
import ProtoButton from './ProtoButton';

const Button = props => {
  return <ProtoButton {...props}>{props.children}</ProtoButton>;
};

Button.propTypes = {
  'prop-color': PropTypes.string,
  'prop-size': PropTypes.string,
  'prop-type': PropTypes.string,
};

Button.defaultProps = {
  'prop-color': 'blue',
  'prop-size': 'md',
  'prop-type': 'solid',
};

export default Button;
