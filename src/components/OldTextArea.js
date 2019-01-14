import React from 'react';
import PropTypes from 'prop-types';

const TextArea = ({
  // DOM props
  name,
  placeholder,
  value,
  className,
  row,
  col,
  disabled,
  autoFocus,
  maxLength,
  readOnly,
  // events
  onChange,
  onFocus,
  onBlur,
  format,
  size,
  children,
  // validated component props (if wrapped)
  isValidated,
  validationClassnames,
  focussed,
  beenFocussed,
  hasSubmitted,
  displayPass,
  displayFailure,
  error,
}) => {

  const _disabled = disabled === true ? 'br-gray-30' : '';

  const s = getStyles(styleManifest, format, size);

  // This enables all children of this component to share the state of this
  // component.
  const childrenWithProps = React.Children.map(children, child =>
    React.cloneElement(child, { displayPass, displayFailure, focussed })
  );

  return (
    <div className={'rel'}>
      <textarea
        className={`bw-2 flex bs-solid ${s} ${validationClassnames} ${_disabled} ${className}`}
        onChange={e => onChange(e)}
        onFocus={e => onFocus(e)}
        onBlur={e => onBlur(e)}
        placeholder={placeholder}
        name={name}
        value={value}
        // row={row}
        // col={col}
        disabled={disabled}
        autoFocus={autoFocus}
        maxLength={maxLength}
        readOnly={readOnly}
      />
      {
        childrenWithProps
      }
      {
        displayFailure === true && isValidated === true
          ? <div className={'yellow text-600 h-6 mt-1'}>{error}</div>
          : <div/>
      }

    </div>
  );
};

const getStyles = (m, t, s) => `${m[t][s] || ''}`;

const styleManifest = {
  normal: {
    l: 'h-80 fs-7 ph-4',
    m: 'h-40 fs-35 ph-4',
    s: 'h-24 fs-35 ph-1',
  }
}


TextArea.propTypes = {
  disabled: PropTypes.bool,
  onChange: PropTypes.func,
  onBlur: PropTypes.func,
  onFocus: PropTypes.func,
  className: PropTypes.string,
  children: PropTypes.node,
  autoFocus: PropTypes.bool,
  maxLength: PropTypes.number,
  readOnly: PropTypes.bool,
  name: PropTypes.string,
  value: PropTypes.string,
  row: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  col: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  isSelected: PropTypes.bool,
  hasBeenSelected: PropTypes.bool,
  hasSubmitted: PropTypes.bool,
  displayPass: PropTypes.bool,
  displayFailure: PropTypes.bool,
  error: PropTypes.string,
  validationClassnames: PropTypes.string,
};


TextArea.defaultProps = {
  disabled: false,
  onChange: () => {},
  onBlur: () => {},
  onFocus: () => {},
  value: '',
  name: '',
  className: '',
  isSelected: false,
  hasBeenSelected: false,
  hasSubmitted: false,
  displayPass: false,
  displayFailure: false,
  error: '',
  size: 'm',
  format: 'normal',
  validationClassnames: 'br-gray-50 f-br-blue outline-blue',
};


export default TextArea;
