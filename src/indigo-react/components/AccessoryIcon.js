import React from 'react';

import Flex from './Flex';

const kPendingAccessory = '⋯';
const kSuccessAccessory = '✔';
const kFailureAccessory = '×';

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
  <AccessoryIcon>{kPendingAccessory}</AccessoryIcon>
);

AccessoryIcon.Success = () => (
  <AccessoryIcon>{kSuccessAccessory}</AccessoryIcon>
);

AccessoryIcon.Failure = () => (
  <AccessoryIcon>{kFailureAccessory}</AccessoryIcon>
);

export default AccessoryIcon;
