import React from 'react';
import PropTypes from 'prop-types';


const DropdownItem = props => {

  const _disabled = props.disabled
    ? 'gray-50'
    : 'h-br-blue br-gray-50 h-bg-blue h-white';

  return (
    <button
      disabled={props.disabled}
      style={props.style}
      className={`h-10 m-0 p-0 ph-2 bg-white flex justify-start items-center bs-solid brw-2 blw-2 btw-0 bbw-0 sans ${_disabled} ${props.className}`}
      onClick={props.onClick}>
      { props.children }
    </button>
  )
};

DropdownItem.propTypes = {
  disabled: PropTypes.bool,
  onClick: PropTypes.func,
  className: PropTypes.string,
  children: PropTypes.node,
  style: PropTypes.object,
};


DropdownItem.defaultProps = {
  className: '',
  onClick: () => {},
  disabled: false,
  style: {},
};

export default DropdownItem;
