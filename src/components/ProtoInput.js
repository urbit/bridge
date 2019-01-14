import React from 'react';
import PropTypes from 'prop-types';

import { getDomProps } from '../lib/base'

const ProtoInput = props => {
  return (
    <input
      // getDomProps gets any prop prepended with 'prop-'. Useful here because
      // one cannot simply pass props like {...props} because the input elem
      // cannot accept children nodes, which are included in the props arg. It
      // is doubly useful because it lets the developer control which props are
      // added to the real DOM.
      {...getDomProps(props)}
      className={props.className}
      onChange={e => props.onChange(e)}
      onKeyPress={e => props.onKeyPress(e)}
      onFocus={e => props.onFocus(e)}
      onBlur={e => props.onBlur(e)}
      placeholder={props.placeholder}
      type={props.type}
      name={props.name}
      style={props.style}
      value={props.value}
      autoFocus={props.autoFocus}
      readOnly={props.readOnly}
      maxLength={props.maxLength}
      autoComplete={props.autoComplete} />
  );
}


ProtoInput.propTypes = {
  disabled:         PropTypes.bool,
  onChange:         PropTypes.func,
  onBlur:           PropTypes.func,
  onFocus:          PropTypes.func,
  onKeyPress:       PropTypes.func,
  className:        PropTypes.string,
  style:            PropTypes.object,
  children:         PropTypes.node,
  autoFocus:        PropTypes.bool,
  readOnly:         PropTypes.bool,
  name:             PropTypes.string,
  value:            PropTypes.string,
  autoComplete:     PropTypes.string,
  type:             PropTypes.string,
};


ProtoInput.defaultProps = {
  disabled:         false,
  autoFocus:        false,
  onChange:         () => {},
  onBlur:           () => {},
  onFocus:          () => {},
  onKeyPress:       () => {},
  style:            {},
  className:        '',
  value:            '',
  name:             '',
  autoComplete:     'off',
  type:             'input',
};


export default ProtoInput;
