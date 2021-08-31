import React, { useState } from 'react';

import Dropdown from './Dropdown';

import './FeeDropdown.scss';

interface Fee {
  amount: number;
  display: string;
}

const FeeDropdown = () => {
  const [open, setOpen] = useState<boolean>(false);
  const [fee, setFee] = useState<Fee>({
    amount: 0.0002,
    display: '0.0002 ETH (15 min)',
  });

  const fees = [
    {
      amount: 0.0004,
      display: '0.0004 ETH (10 min)',
    },
    {
      amount: 0.0002,
      display: '0.0002 ETH (15 min)',
    },
    {
      amount: 0.0002,
      display: '0.0001 ETH (1 hour)',
    },
  ];

  const selectFee = (fee: Fee) => () => {
    setFee(fee);
    setOpen(false);
  };

  return (
    <Dropdown
      className="fee-dropdown"
      open={open}
      value={fee.display}
      toggleOpen={() => setOpen(!open)}>
      {fees.map(fee => (
        <div className="entry" key={fee.display} onClick={selectFee(fee)}>
          {fee.display}
        </div>
      ))}
    </Dropdown>
  );
};

export default FeeDropdown;
