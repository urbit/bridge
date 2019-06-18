import React from 'react';
import PropTypes from 'prop-types';
import { getDomProps } from '../../lib/base';

const ProtoButton = props => {
  return (
    <button
      {...getDomProps(props)}
      className={`${props.className} sans`}
      type={props.type}
      style={props.style}
      onClick={props.onClick}
      disabled={props.disabled}
      autoFocus={props.autoFocus}>
      {props.children}
    </button>
  );
};

ProtoButton.propTypes = {
  disabled: PropTypes.bool,
  onClick: PropTypes.func,
  className: PropTypes.string,
  children: PropTypes.node,
  autofocus: PropTypes.bool,
  style: PropTypes.object,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
};

ProtoButton.defaultProps = {
  className: '',
  autoFocus: false,
  onClick: () => {},
  disabled: false,
  style: {},
  type: 'button',
};

export default ProtoButton;
