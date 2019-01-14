import React from 'react'
import PropTypes from 'prop-types';
import ProtoButton from './ProtoButton'

const CheckboxButton = props => {

  const onOff = props.state === true
    ? 'cb-on br-blue bg-blue outline-blue'
    : 'bg-transparent br-black outline-blue';

  const checkmarkState = props.state === true ? 'o-100' : 'o-0'

  const classes = props.disabled ? 'br-gray-30 bg-gray-10' : onOff


  return (
    <div
      className={`flex items-center ${props.className}`}
      style={props.style}>

      <ProtoButton
        // {...getDomProps(props)}
        {...props}
        className={ `s-7 p-0 o-blue mr-4 bs-solid bw-2 ${classes}` }>

        <svg
          className={checkmarkState}
          width='24'
          height='24'
          viewBox='0 0 24 24'
          fill='none'
          xmlns='http://www.w3.org/2000/svg'>
          <path
            d='M2 3.55661V0H0V5.55661H12.4182V3.55661H2Z'
            transform='translate(6, 13) rotate(-45)'
            fill='white'/>
        </svg>

      </ProtoButton>

      { props.children }

    </div>
  )
}


CheckboxButton.propTypes = {
  state:        PropTypes.bool,
  className:    PropTypes.string,
};


CheckboxButton.defaultProps = {
  state:        false,
  className:    '',
};


export default CheckboxButton
