import React from 'react';
import PropTypes from 'prop-types';

import { pour } from 'sigil-js';
import * as ob from 'urbit-ob';
import ReactSVGComponents from './ReactSVGComponents';

const isValidPatp = patp => {
  let isValid = false;
  try {
    isValid = ob.isValidPatp(patp);
  } catch (err) {
    return isValid;
  }
  return isValid;
};

const ValidatedSigil = ({
  className,
  children,
  style,
  color,
  patp,
  size,
  margin,
  displayPass,
  displayFailure,
  focussed,
  beenFocussed,
}) => {
  const colorStyle = styleSelector(displayPass, displayFailure, focussed);

  return (
    <div className={`${className}`} style={style}>
      {isValidPatp(patp) ? (
        pour({
          patp: patp,
          renderer: ReactSVGComponents,
          size: size,
          colorway: colorStyle,
          margin: margin,
        })
      ) : (
        <div
          className={'bg-transparent'}
          style={{
            width: size,
            height: size,
          }}
        />
      )}
      {children}
    </div>
  );
};

const styleSelector = (pass, fail, focus) => {
  if (fail === true) return ['#FFFFFF', '#F8C134'];
  if (pass === true) return ['#FFFFFF', '#2AA779'];
  if (focus === true) return ['#FFFFFF', '#4330FC'];
  return ['#FFFFFF', '#7F7F7F'];
};

ValidatedSigil.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
  style: PropTypes.object,
};

ValidatedSigil.defaultProps = {
  className: '',
  style: {},
};

export default ValidatedSigil;
