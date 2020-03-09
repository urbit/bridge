import React, { useState, useMemo } from 'react';

import useBreakpoints from 'lib/useBreakpoints';

import View from 'components/View';
import Accordion from 'components/Accordion';

import PrivateKey from './PrivateKey';
import Keystore from './Keystore';
import Ledger from './Ledger';
import Metamask from './Metamask';
import Trezor from './Trezor';
import Mnemonic from './Mnemonic';

const NAMES = {
  PRIVATE_KEY: 'PRIVATE_KEY',
  KEYSTORE: 'KEYSTORE',
  LEDGER: 'LEDGER',
  TREZOR: 'TREZOR',
  METAMASK: 'METAMASK',
  MNEMONIC: 'MNEMONIC',
};

const VIEWS = {
  [NAMES.PRIVATE_KEY]: PrivateKey,
  [NAMES.KEYSTORE]: Keystore,
  [NAMES.LEDGER]: Ledger,
  [NAMES.TREZOR]: Trezor,
  [NAMES.METAMASK]: Metamask,
  [NAMES.MNEMONIC]: Mnemonic,
};

const OPTIONS = [
  { text: 'Mnemonic (BIP 39)', value: NAMES.MNEMONIC },
  { text: 'Ledger', value: NAMES.LEDGER },
  { text: 'Trezor', value: NAMES.TREZOR },
  { text: 'Metamask', value: NAMES.METAMASK },
  { text: 'Ethereum Private Key', value: NAMES.PRIVATE_KEY },
  { text: 'Ethereum Keystore', value: NAMES.KEYSTORE },
];

const isHardware = name => !![NAMES.TREZOR, NAMES.LEDGER].find(n => n === name);

export default function Other({ className, ...rest }) {
  const [currentTab, setCurrentTab] = useState(undefined);

  const hardwareAllowed = useBreakpoints([false, true, true]);
  const options = useMemo(
    () =>
      OPTIONS.map(o =>
        !isHardware(o.value)
          ? o
          : { ...o, disabled: !hardwareAllowed && ' not available on mobile' }
      ),
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
