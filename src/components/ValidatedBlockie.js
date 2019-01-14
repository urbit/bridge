import React from 'react'
import PropTypes from 'prop-types'
import makeBlockie from 'ethereum-blockies-base64'

const ValidatedBlockie = ({
  className,
  children,
  style,
  color,
  address,
  size,
  validator,
  displayPass,
  displayFailure,
  focussed,
  beenFocussed
}) => {

  const colorStyle = styleSelector(displayPass, displayFailure, focussed);

  return (
    <div className={`${className}`} style={style}>
      { displayPass
        ? <img
          alt={ address }
          src={ makeBlockie(address) }
          style={{
            width: size,
            height: size,
          }} />
        : <div className={''} style={{
          backgroundColor: colorStyle[1],
          width: size,
          height: size,
        }} />
      }
      {
        children
      }
    </div>
  )
}


const styleSelector = (pass, fail, focus) => {
  if (fail === true) return ['#FFFFFF', '#F8C134'];
  if (pass === true) return ['#FFFFFF', '#2AA779'];
  if (focus === true) return ['#FFFFFF', '#4330FC'];
  return ['#FFFFFF', '#7F7F7F'];
}


ValidatedBlockie.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
  style: PropTypes.object,
};


ValidatedBlockie.defaultProps = {
  className: '',
  style: {},
};


export default ValidatedBlockie;
