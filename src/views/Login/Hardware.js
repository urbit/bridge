import React, { useState } from 'react';

import Accordion from 'components/Accordion';

import Ledger from './Ledger';
import Trezor from './Trezor';

const NAMES = {
  LEDGER: 'LEDGER',
  TREZOR: 'TREZOR',
};

const VIEWS = {
  [NAMES.LEDGER]: Ledger,
  [NAMES.TREZOR]: Trezor,
};

const OPTIONS = [
  { text: 'Ledger', value: NAMES.LEDGER },
  { text: 'Trezor', value: NAMES.TREZOR },
];

export default function Hardware({ className, ...rest }) {
  const [currentTab, setCurrentTab] = useState(undefined);

  return (
    <Accordion
      className={className}
      views={VIEWS}
      options={OPTIONS}
      currentTab={currentTab}
      onTabChange={setCurrentTab}
      //
      {...rest}
    />
  );
}
