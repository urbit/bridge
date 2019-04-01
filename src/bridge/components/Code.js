import React from 'react';
import PropTypes from 'prop-types'

const Code = ({ className, children, style, measure }) => {

  // const s = getStyles(styleManifest, measure)

  return (
    <pre className={`flex ${className}`} style={style}>
      { children }
    </pre>
  )
}

// const getStyles = (sm, m) => sm[m];
//
// const styleManifest = {
//   sm: 'measure-sm',
//   md: 'measure-md',
//   lg: 'measure-lg',
// }

Code.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
  style: PropTypes.object,
};


Code.defaultProps = {
  className: '',
  style: {},
  measure: 'md',
};


export default Code;
