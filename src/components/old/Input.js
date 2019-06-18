import React from 'react';
import PropTypes from 'prop-types';
import ProtoInput from './ProtoInput';

const Input = props => {
  const _disabled = props.disabled === true ? 'br-gray-30' : '';

  // This enables all children of this component to share the state of this
  // component.
  const childrenWithProps = React.Children.map(props.children, child => {
    const propsToPass = {
      displayPass: props.displayPass,
      displayFailure: props.displayFailure,
      focussed: props.focussed,
      beenFocussed: props.beenFocussed,
      error: props.error,
    };
    return React.cloneElement(child, propsToPass);
  });

  const className = props.advanced
    ? `${props.valClassname} ${props.className}`
    : `br-gray-50 f-br-blue outline-blue ${props.className}`;

  return (
    <div className={'relative'}>
      <ProtoInput
        {...props}
        // prop-focussed={props.focussed.toString()}
        className={`p-3 b-2 b-solid flex ${_disabled} ${className}`}
        onChange={e => props.onChange(e.target.value)}
      />
      {props.displayFailure === true && props.advanced === true ? (
        <div className={'yellow text-600 h-6 mt-1 fs-3'}>{props.error}</div>
      ) : (
        <div />
      )}
      {childrenWithProps}
    </div>
  );
};

Input.propTypes = {
  focussed: PropTypes.bool,
  beenFocussed: PropTypes.bool,
  hasSubmitted: PropTypes.bool,
  displayPass: PropTypes.bool,
  displayFailure: PropTypes.bool,
  advanced: PropTypes.bool,
  error: PropTypes.string,
  valClassname: PropTypes.string,
  size: PropTypes.oneOf(['s', 'm', 'l', 'xl']),
};

Input.defaultProps = {
  focussed: false,
  beenFocussed: false,
  hasSubmitted: false,
  displayPass: false,
  displayFailure: false,
  advanced: false,
  error: '',
  size: 'm',
  format: 'normal',
};

export default Input;
