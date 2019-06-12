import React from 'react';
import PropTypes from 'prop-types';
import { isUndefined } from 'lodash';

const Spacing = ({ className, children, h, w }) => {
  const h_cn = isUndefined(h) ? '' : `mt-${h}`;
  const w_cn = isUndefined(w) ? '' : `ml-${w}`;

  return <div className={`${h_cn} ${w_cn} ${className}`}>{children}</div>;
};

Spacing.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
  h: PropTypes.number,
  w: PropTypes.number,
};

Spacing.defaultProps = {
  className: '',
  h: 0,
  w: 0,
};

export default Spacing;
