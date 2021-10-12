import React, { useState } from 'react';
import { Icon } from '@tlon/indigo-react';

import Metamask from './Metamask';
import Ticket from './Ticket';
import Mnemonic from './Mnemonic';
import WalletConnect from './WalletConnect';
import LoginSelector from './LoginSelector';
import { ReactComponent as MetamaskIcon } from 'assets/metamask.svg';
import { ReactComponent as WalletConnectIcon } from 'assets/wallet-connect.svg';

const NAMES = {
  METAMASK: 'METAMASK',
  MNEMONIC: 'MNEMONIC',
  WALLET_CONNECT: 'WALLET_CONNECT',
  MASTER_TICKET: 'MASTER_TICKET',
};

const VIEWS = {
  [NAMES.METAMASK]: Metamask,
  [NAMES.MNEMONIC]: Mnemonic,
  [NAMES.WALLET_CONNECT]: WalletConnect,
  [NAMES.MASTER_TICKET]: Ticket,
};

const rightArrowIcon = <Icon icon="ChevronEast" />;
const settingsIcon = <Icon icon="Gear" />;

const OPTIONS = [
  {
    text: 'Master Key',
    value: NAMES.MASTER_TICKET,
    menuIcon: rightArrowIcon,
    headerIcon: settingsIcon,
  },
  {
    text: 'Metamask',
    value: NAMES.METAMASK,
    menuIcon: <MetamaskIcon className="logo-icon" />,
    headerIcon: settingsIcon,
  },
  {
    text: 'WalletConnect',
    value: NAMES.WALLET_CONNECT,
    menuIcon: <WalletConnectIcon className="logo-icon" />,
    headerIcon: settingsIcon,
  },
  {
    text: 'Recovery Phrase',
    value: NAMES.MNEMONIC,
    menuIcon: rightArrowIcon,
    headerIcon: settingsIcon,
  },
];

interface OtherProps {
  className: string;
  goHome: () => void;
}

export default function Other({ className, ...rest }: OtherProps) {
  const [currentTab, setCurrentTab] = useState<string | undefined>(undefined);

  return (
    <>
      <LoginSelector
        className={className}
        views={VIEWS}
        options={OPTIONS}
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        //
        {...rest}
      />
    </>
  );
}
