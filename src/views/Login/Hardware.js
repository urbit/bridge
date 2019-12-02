import React, { useMemo, useState } from 'react';

import useBreakpoints from 'lib/useBreakpoints';

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

  // using breakpoint to decide if we're on mobile or not
  // see ActivateCode for more details on this approach
  const hardwareAllowed = useBreakpoints([false, true, true]);

  const options = useMemo(
    () =>
      OPTIONS.map(option => ({
        ...option,
        disabled: !hardwareAllowed && ' not availble on mobile',
      })),
    [hardwareAllowed]
  );

  return (
    <Accordion
      className={className}
      views={VIEWS}
      options={options}
      currentTab={currentTab}
      onTabChange={setCurrentTab}
      //
      {...rest}
    />
  );
}
