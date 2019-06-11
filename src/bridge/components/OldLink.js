import React from 'react';
import PropTypes from 'prop-types';

const Link = ({
  disabled,
  onClick,
  className,
  autoFocus,
  style,
  href,
  target,
  children,
  size,
  color,
  type,
}) => {
  const _color = disabled ? 'disabled' : color;
  const _s = getStyles(styleManifest, type, _color, size);
  const _disabled = disabled ? 'disabled' : '';

  return (
    <a
      className={`${_s} ${className} ${_disabled} sans`}
      style={style}
      onClick={onClick}
      disabled={disabled}
      autoFocus={autoFocus}
      href={href}
      target={target}>
      {children}
    </a>
  );
};

const getStyles = (m, t, c, s) => `${m[t][c]} ${m[t][s]} ${m[t]['all']}`;

const styleManifest = {
  link: {
    // Color selection
    blue: 'blue',
    black: 'black',
    green: 'green',
    yellow: 'yellow',
    gray: 'gray-50',
    disabled: 'gray-30',
    // Size selection
    s: 'text-sans-serif fs-35 mb-0',
    m: 'text-sans-serif fs-4 mb-1',
    l: 'fs-5 mb-2',
    // Applied to all link buttons
    all: 'bg-transparent text-400 underline user-select-auto p-0',
  },
  outline: {
    // Color selection
    blue: 'b-blue blue',
    black: 'b-black black',
    green: 'b-green green',
    yellow: 'b-yellow yellow',
    gray: 'b-gray-50 gray-50',
    disabled: 'b-gray-30 gray-30',
    // Size selection
    s: 'h-7 ph-2 fs-3 b-1',
    m: 'h-9 ph-4 fs-4 b-2',
    l: 'h-13 ph-6 fs-5 b-2',
    // Applied to all outline buttons
    all: 'bg-transparent b-solid',
  },
  text: {
    // Color selection
    blue: 'blue',
    black: 'black',
    green: 'green',
    yellow: 'yellow',
    gray: 'gray-50',
    disabled: 'gray-30',
    // Size selection
    s: 'h-6 ph-2 fs-35',
    m: 'h-9 ph-4 fs-4',
    l: 'h-13 ph-6 fs-5',
    // Applied to all outline buttons
    all: 'bg-transparent b-0',
  },
  block: {
    // Color selection
    blue: 'bg-blue b-blue',
    black: 'bg-black b-black',
    green: 'bg-green b-green',
    yellow: 'bg-yellow b-yellow',
    gray: 'bg-gray b-gray',
    disabled: 'b-gray-30 bg-gray-30',
    // Size selection
    s: 'h-6 ph-2 fs-3 sans',
    m: 'h-9 ph-4 fs-4',
    l: 'h-13 ph-6 fs-5',
    // Applied to all block buttons
    all: 'white b-2 br-solid',
  },
};

Link.propTypes = {
  disabled: PropTypes.bool,
  onClick: PropTypes.func,
  className: PropTypes.string,
  children: PropTypes.node,
  autoFocus: PropTypes.bool,
  style: PropTypes.object,
};

Link.defaultProps = {
  className: '',
  autoFocus: false,
  onClick: () => {},
  disabled: false,
  size: 'm',
  color: 'blue',
  type: 'block',
  style: {},
};

export default Link;
