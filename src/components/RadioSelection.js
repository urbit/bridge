import React from 'react';
import PropTypes from 'prop-types';
import ProtoButton from './ProtoButton'


const RadioSelection = props => {
  const border = props.isSelected
    ? 'b-blue'
    : 'b-gray-50'

  const style = props.disabled === true ? 'br-gray-30 gray-50' : border;



  return (
    <ProtoButton
      {...props}
      className={`h-20 b-2 b-solid ph-4 pv-2 flex flex-column justify-center outline-blue ${style} ${props.className}`}
      style={{ width: '100%', whiteSpace: 'normal', textAlign: 'left' }}>
      { props.children }
    </ProtoButton>
  )
}


// RadioSelection.propTypes = {
//   'prop-color': PropTypes.string,
//   'prop-size': PropTypes.string,
//   'prop-selected': PropTypes.boolean,
//   'prop-type': PropTypes.string,
// };
//
//
// RadioSelection.defaultProps = {
//   'prop-color': 'white',
//   'prop-selected': false,
//   'prop-size': 'md wide',
//   'prop-type': 'solid',
// };


export default RadioSelection;
