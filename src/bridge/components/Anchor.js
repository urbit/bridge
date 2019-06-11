import React from 'react';
import PropTypes from 'prop-types';

import ProtoAnchor from './ProtoAnchor';

const Anchor = props => {
  return (
    <ProtoAnchor {...props} prop-disabled={`${props['prop-disabled']}`}>
      {props.children}
    </ProtoAnchor>
  );
};

Anchor.propTypes = {
  'prop-disabled': PropTypes.bool,
  'prop-color': PropTypes.string,
  'prop-size': PropTypes.string,
  'prop-type': PropTypes.string,
};

Anchor.defaultProps = {
  'prop-disabled': false,
  'prop-color': 'black',
  'prop-size': 'md',
  'prop-type': 'link',
};

export default Anchor;
