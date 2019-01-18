import React from 'react'
import PropTypes from 'prop-types';


const InnerLabelDropdown = props => {

  const menuVisibility = props.isOpen === true
    ? 'visible'
    : 'hidden';

  const selectedClasses = props.isOpen === true
    ? 'br-blue'
    : 'br-gray-50';

  return (
    <div className={`rel flex ${props.className}`}>
    <div
      className={`fix full o-0 ${menuVisibility}`}
      onClick={props.handleClose}
    />

      <button
        className={`h-16 mp-0 bg-white outline-blue sans`}
        style={{width: '100%'}}
        onClick={props.handleToggle}
        disabled={props.disabled}>
        <div className={'flex'}>
          <div style={{width: '100%'}} className={`ph-4 flex items-center b-2 br-0 b-solid h-16 ${selectedClasses}`}>
            <div className={'text-400 mr-2'}>{props.title}</div>
            <div className={'text-600'}>{props.currentSelectionTitle}</div>
          </div>
          <div className={'white bg-blue h-16 w-18 flex-center-all text-sm'}>{'▼'}</div>
        </div>
      </button>

      <div className={`abs flex-column bg-white t-18 l-0 w-100 ${menuVisibility}`}>
        <div className={'pv-1 b-solid b-gray-50 b-2 bb-0'} />

        { props.children }

        <div className={'pv-1 b-solid b-gray-50 b-2 bt-0'} />
      </div>

    </div>
  )
}

InnerLabelDropdown.propTypes = {
  disabled: PropTypes.bool,
  isOpen: PropTypes.bool,
  handleToggle: PropTypes.func,
  handleClose: PropTypes.func,
  className: PropTypes.string,
  title: PropTypes.string,
  children: PropTypes.node,
  style: PropTypes.object,
  currentSelectionTitle: PropTypes.string,
};


InnerLabelDropdown.defaultProps = {
  isOpen: false,
  className: '',
  title: '',
  currentSelectionTitle: '',
  handleToggle: () => {},
  handleClose: () => {},
  disabled: false,
  style: {},
};

export default InnerLabelDropdown
