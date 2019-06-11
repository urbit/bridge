import React from 'react';
import PropTypes from 'prop-types';

const Chevron = props => {
  return (
    <img
      src={`data:image/svg+xml;utf8,<svg width="11" height="24" viewBox="0 0 11 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 12L10.387 12.3166L10.646 12L10.387 11.6833L10 12ZM0.613022 1.31662L9.61302 12.3166L10.387 11.6833L1.38698 0.68338L0.613022 1.31662ZM9.61302 11.6833L0.613021 22.6834L1.38698 23.3166L10.387 12.3166L9.61302 11.6833Z" stroke="${
        props.color
      }" stroke-width="${props.strokeWidth}" fill="${props.color}"/></svg>`}
      alt=""
      style={props.style}
      className={props.className}
    />
  );
};

Chevron.propTypes = {
  style: PropTypes.object,
  className: PropTypes.string,
  color: PropTypes.string,
  strokeWidth: PropTypes.string,
};

Chevron.defaultProps = {
  style: {},
  className: '',
  color: 'black',
  strokeWidth: '1px',
};

export default Chevron;
