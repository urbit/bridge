import React from 'react';
import PropTypes from 'prop-types'

const P = ({ className, children, style, measure }) => {

  const s = getStyles(styleManifest, measure)

  return (
    <p className={`mb-7 ${s} ${className}`} style={style}>
      { children }
    </p>
  )
}

const getStyles = (sm, m) => sm[m];

const styleManifest = {
  sm: 'measure-sm',
  md: 'measure-md',
  lg: 'measure-lg',
}

P.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
  style: PropTypes.object,
};


P.defaultProps = {
  className: '',
  style: {},
  measure: 'md',
};


export default P;
