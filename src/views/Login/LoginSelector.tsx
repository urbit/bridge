import React, { useCallback, useState } from 'react';
import cn from 'classnames';
import Web3 from 'web3';
import { Grid } from 'indigo-react';
import { Box, Button, Icon, LoadingSpinner, Text } from '@tlon/indigo-react';
import { useHistory } from 'store/history';
import { Just, Nothing } from 'folktale/maybe';
import { FORM_ERROR } from 'final-form';

import { useWallet } from 'store/wallet';
import { usePointCursor } from 'store/pointCursor';

import { WALLET_TYPES } from 'lib/constants';
import { MetamaskWallet } from 'lib/metamask';
import { getAuthToken } from 'lib/authToken';
import { useWalletConnect } from 'lib/useWalletConnect';

import Modal from 'components/L2/Modal';
import HeaderButton from 'components/L2/Headers/HeaderButton';
import './LoginSelector.scss';
import { NAMES } from './Other';

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
  const { push, names }: any = useHistory();
  const [showModal, setShowModal] = useState(false);
  const [metamaskSelected, setMetamaskSelected] = useState(false);

  const {
    setWallet,
    setWalletType,
    resetWallet,
    setAuthToken,
  }: any = useWallet();

  const { connect } = useWalletConnect();

  const { setPointCursor }: any = usePointCursor();

  const goToActivate = useCallback(() => push(names.ACTIVATE), [
    push,
    names.ACTIVATE,
  ]);

  const connectMetamask = useCallback(async () => {
    try {
      setMetamaskSelected(true);
      resetWallet();
      setWalletType(WALLET_TYPES.METAMASK);
      setPointCursor(Nothing());

      const accounts = await (window as any).ethereum.send(
        'eth_requestAccounts'
      );
      const wallet = new MetamaskWallet(accounts.result[0]);

      const web3 = new Web3((window as any).ethereum);
      const authToken = await getAuthToken({
        address: wallet.address,
        walletType: WALLET_TYPES.METAMASK,
        web3,
      });

      setAuthToken(Just(authToken));
      setWallet(Just(wallet));
      setWalletType(WALLET_TYPES.METAMASK);
      goHome();
    } catch (e) {
      setMetamaskSelected(false);
      console.error(e);
      return { [FORM_ERROR]: (e as any).message };
    }
  }, [
    setAuthToken,
    setWallet,
    setWalletType,
    resetWallet,
    setPointCursor,
    setMetamaskSelected,
    goHome,
  ]);

  const selectOption = (value: string) => () => {
    if (value === NAMES.METAMASK) {
      connectMetamask();
    } else {
      if (value === NAMES.WALLET_CONNECT) {
        connect();
      }
      setCurrentTab(value);
    }
  };

  const loader = <LoadingSpinner background="#bce2ff" foreground="#219DFF" />;

  if (!currentTab) {
    return (
      <Grid className={className}>
        {options.map((option, i) => (
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
