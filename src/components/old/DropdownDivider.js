import React from 'react';

const DropdownDivider = props => {
  return (
    <div className={`br-gray-50 bs-solid bw-0-2-0-2 ${props.className}`}>
      <div className={`block bs-solid bw-2-0-0-0 br-gray-30 mv-2`} />
    </div>
  );
};

export default DropdownDivider;
