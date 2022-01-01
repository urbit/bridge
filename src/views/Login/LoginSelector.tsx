import React, { useCallback, useState } from 'react';
import cn from 'classnames';
import { Grid } from 'indigo-react';
import { Box, Button, Icon, LoadingSpinner, Text } from '@tlon/indigo-react';
import { useHistory } from 'store/history';

import { WALLET_TYPES } from 'lib/constants';
import { useWalletConnect } from 'lib/useWalletConnect';

import Modal from 'components/L2/Modal';
import HeaderButton from 'components/L2/Headers/HeaderButton';
import './LoginSelector.scss';
import { NAMES } from './Other';
import useLoginView from 'lib/useLoginView';

interface LoginSelectorProps {
  className: string;
  views: { [key: string]: React.ReactNode };
  options: {
    text: string;
    value: string;
    menuIcon: React.ReactNode;
    headerIcon: React.ReactNode;
  }[];
  currentTab?: string;
  setCurrentTab: (tab?: string) => void;
  goHome: () => void;
}

export default function LoginSelector({
  className,
  views,
  options,
  currentTab,
  setCurrentTab,
  goHome,
  // Tab props
  ...rest
}: LoginSelectorProps) {
  useLoginView(WALLET_TYPES.WALLET_CONNECT);

  const { push, names }: any = useHistory();
  const [showModal, setShowModal] = useState(false);
  // TODO: do we still need this? currently not being set
  const [metamaskSelected, setMetamaskSelected] = useState(false);

  const { connect } = useWalletConnect();

  const goToActivate = useCallback(() => push(names.ACTIVATE), [
    push,
    names.ACTIVATE,
  ]);

  const selectOption = (value: string) => async () => {
    if (value === NAMES.WALLET_CONNECT) {
      connect();
    }
    setCurrentTab(value);
  };

  const loader = <LoadingSpinner background="#bce2ff" foreground="#219DFF" />;

  const availableOptions = options.filter(
    ({ value }) => value !== NAMES.METAMASK || !!(window as any).ethereum
  );

  if (!currentTab) {
    return (
      <Grid className={className}>
        {availableOptions.map((option, i) => (
          <React.Fragment key={option.value}>
            <Grid.Item
              full
              className={cn('f5 pv3 rel pointer login-menu-item')}
              onClick={selectOption(option.value)}>
              {option.text}
              {option.value === NAMES.METAMASK && metamaskSelected
                ? loader
                : option.menuIcon}
            </Grid.Item>
          </React.Fragment>
        ))}
        <Grid.Item full className="activate" as={Button} onClick={goToActivate}>
          Activate a Planet
        </Grid.Item>
        <Grid.Item
          full
          className="unsupported-info"
          as={Text}
          onClick={() => setShowModal(true)}>
          <Icon icon="Info" />I have a wallet type not supported here
        </Grid.Item>
        <Modal show={showModal} hide={() => setShowModal(false)}>
          <Box className="info-modal-content">
            <div className="fw-bold">Other Wallet Types</div>
            <div className="mb5">
              All other wallet types are now supported via Metamask or
              WalletConnect.
            </div>
            <div className="mb5">
              If you are you using a{' '}
              <span className="fw-bold">
                Hardware Wallet, Ethereum Keystore, or Ethereum Private Key
              </span>{' '}
              please use Metamask going forward.
            </div>
            <div>
              If you are using a <span className="fw-bold">mobile wallet</span>,
              please use WalletConnect going forward.
            </div>
          </Box>
        </Modal>
      </Grid>
    );
  }

  const Tab = views[currentTab];

  return (
    <Box className="flex-col login-selector">
      <HeaderButton
        className="mb4"
        icon="ChevronWest"
        onClick={() => setCurrentTab(undefined)}
      />
      <Grid.Item full as={Tab} {...rest} goHome={goHome} />
    </Box>
  );
}
