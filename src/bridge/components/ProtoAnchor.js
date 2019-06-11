import React from 'react';
import PropTypes from 'prop-types';

const ProtoAnchor = props => {
  return <a {...props}>{props.children}</a>;
};

ProtoAnchor.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
  autoFocus: PropTypes.bool,
  style: PropTypes.object,
  href: PropTypes.string,
  rel: PropTypes.string,
  target: PropTypes.oneOf(['_self', '_blank', '_parent', '_top']),
};

ProtoAnchor.defaultProps = {
  className: '',
  autoFocus: false,
  style: {},
  href: '',
  rel: '',
  target: '_self',
};

export default ProtoAnchor;
