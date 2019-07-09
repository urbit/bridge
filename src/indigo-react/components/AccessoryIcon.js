import React from 'react';

import Flex from './Flex';

const PENDING_ACCESSORY = '⋯';
const SUCCESS_ACCESSORY = '✓';
const FAILURE_ACCESSORY = '✗';

function AccessoryIcon({ ...props }) {
  return (
    <Flex
      justify="center"
      align="center"
      style={{ height: '100%', width: '100%' }}
      {...props}
    />
  );
}

AccessoryIcon.Pending = () => (
  <AccessoryIcon>{PENDING_ACCESSORY}</AccessoryIcon>
);

AccessoryIcon.Success = () => (
  <AccessoryIcon>{SUCCESS_ACCESSORY}</AccessoryIcon>
);

AccessoryIcon.Failure = () => (
  <AccessoryIcon>{FAILURE_ACCESSORY}</AccessoryIcon>
);

export default AccessoryIcon;
