import React from 'react';
import PropTypes from 'prop-types'

import { Row, Col } from './Base'

const RowCol = ({ className, children, style }) => {
  return (
    <Row className={`${className}`} style={style}>
      <Col>
      { children }
      </Col>
    </Row>
  )
}


RowCol.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
  style: PropTypes.object,
};


RowCol.defaultProps = {
  className: '',
  style: {},
};


export default RowCol;
