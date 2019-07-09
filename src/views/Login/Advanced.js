import React, { useState } from 'react';

import Tabs from 'components/Tabs';
import PrivateKey from './PrivateKey';
import Keystore from './Keystore';

const NAMES = {
  PRIVATE_KEY: 'PRIVATE_KEY',
  KEYSTORE: 'KEYSTORE',
};

const VIEWS = {
  [NAMES.PRIVATE_KEY]: PrivateKey,
  [NAMES.KEYSTORE]: Keystore,
};

const OPTIONS = [
  { text: 'Ethereum Private Key', value: NAMES.PRIVATE_KEY },
  { text: 'Ethereum Keystore', value: NAMES.KEYSTORE },
];

export default function Advanced({ loginCompleted, className }) {
  const [currentTab, setCurrentTab] = useState(NAMES.PRIVATE_KEY);

  return (
    <Tabs
      className={className}
      views={VIEWS}
      options={OPTIONS}
      currentTab={currentTab}
      onTabChange={setCurrentTab}
      //
      loginCompleted={loginCompleted}
    />
  );
}
