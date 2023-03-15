import React, { useCallback, useState } from 'react';
import cn from 'classnames';
import { Flex, Grid } from 'indigo-react';
import {
  Box,
  Button,
  Icon,
  LoadingSpinner,
  Row,
  Text,
  Image,
  Checkbox,
} from '@tlon/indigo-react';
import Web3 from 'web3';
import { Just } from 'folktale/maybe';

import { useHistory } from 'store/history';
import { useWallet } from 'store/wallet';
import { useNetwork } from 'store/network';

import { WALLET_TYPES } from 'lib/constants';
import { useWalletConnect } from 'lib/useWalletConnect';
import { MetamaskWallet } from 'lib/metamask';
import { expectedChainId } from 'lib/network';
import useLoginView from 'lib/useLoginView';
import { getAuthToken } from 'lib/authToken';

import Modal from 'components/L2/Modal';
import HeaderButton from 'components/L2/Headers/HeaderButton';
import { NAMES } from './Other';

import './LoginSelector.scss';
import { abbreviateAddress } from 'lib/utils/address';

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
  const {
    setWallet,
    setWalletType,
    setAuthToken,
    setFakeToken,
    skipLoginSigning,
    setSkipLoginSigning,
  }: any = useWallet();
  const { setMetamask }: any = useNetwork();
  const [showModal, setShowModal] = useState(false);
  // TODO: do we still need this? currently not being set
  const [metamaskSelected, setMetamaskSelected] = useState(false);

  const [showAdvanced, setShowAdvanced] = useState(false);

  const {
    address,
    authenticate,
    connect,
    disconnect,
    isConnected,
    peerIcon,
  } = useWalletConnect();

  const goToActivate = useCallback(() => push(names.ACTIVATE), [
    push,
    names.ACTIVATE,
  ]);

  const selectMetamask = useCallback(async () => {
    try {
      if (!window.ethereum) {
        throw new Error(
          'Device does not have an Ethereum provider available (is Metamask or Brave Wallet installed?)'
        );
      }

      /**
       * Ensure wallet is connected to expected chain
       */
      if (window.ethereum.chainId !== expectedChainId() ) {
        console.log(`unexpected chain: ${window.ethereum.chainId}`);
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: expectedChainId() }],
        });
        window.location.reload();
        return;
      }

      setMetamask(true);
      setMetamaskSelected(true);

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });
      if (accounts.length === 0) {
        throw new Error('No accounts approved');
      }

      const wallet = new MetamaskWallet(accounts[0]);
      const web3 = new Web3(window.ethereum);
      setWallet(Just(wallet));
      setWalletType(WALLET_TYPES.METAMASK);

      if (skipLoginSigning) {
        setFakeToken();
        goHome();
        return;
      }

      const authToken = await getAuthToken({
        address: wallet.address,
        walletType: WALLET_TYPES.METAMASK,
        web3,
      });

      setAuthToken(Just(authToken));

      goHome();
    } catch (e) {
      console.error(e);
      setMetamask(false);
      setMetamaskSelected(false);
    }
  }, [
    setMetamask,
    setWallet,
    setWalletType,
    skipLoginSigning,
    setAuthToken,
    goHome,
    setFakeToken,
  ]);

  const onSubmitWalletConnect = useCallback(async () => {
    try {
      await authenticate();
      goHome();
    } catch (error) {
      console.warn(error);
    }
  }, [authenticate, goHome]);

  const selectOption = (value: string) => async () => {
    if (value === NAMES.METAMASK) {
      selectMetamask();
    } else if (value === NAMES.WALLET_CONNECT) {
      connect();
    } else {
      setCurrentTab(value);
    }
  };

  const loader = <LoadingSpinner background="#bce2ff" foreground="#219DFF" />;

  const availableOptions = options.filter(
    ({ value }) => value !== NAMES.METAMASK || !!(window as any).ethereum
  );

  const wcConnected = isConnected();

  if (!currentTab) {
    return (
      <Grid className={className}>
        {availableOptions.map((option, i) => (
          <React.Fragment key={option.value}>
            <Grid.Item
              full
              className={cn('f5 pv3 rel pointer login-menu-item')}
              onClick={selectOption(option.value)}>
              {option.value === NAMES.WALLET_CONNECT && wcConnected ? (
                <>
                  <Row className="wc-info">
                    {peerIcon ? (
                      <Image className="wallet-icon" src={peerIcon} />
                    ) : (
                      option.menuIcon
                    )}
                    {address && (
                      <Box className="mono address">
                        {abbreviateAddress(address)}
                      </Box>
                    )}
                  </Row>
                  <Row className="wc-buttons">
                    <Icon
                      onClick={disconnect}
                      className="cancel"
                      icon="X"
                      color="white"
                    />
                    <Icon
                      onClick={onSubmitWalletConnect}
                      className="check"
                      icon="ChevronEast"
                    />
                  </Row>
                </>
              ) : (
                <>
                  {option.text}
                  {option.value === NAMES.METAMASK && metamaskSelected
                    ? loader
                    : option.menuIcon}
                </>
              )}
            </Grid.Item>
          </React.Fragment>
        ))}
        <Grid.Item full className="activate" as={Button} onClick={goToActivate}>
          Activate a Planet
        </Grid.Item>
        <Grid.Item full className="l1-activation" as={Text}>
          Have an invite card with 8 words?{' '}
          <a className="underline" href="https://bridge-sunset.urbit.org">
            Activate
          </a>{' '}
          your L1 planet invite card{' '}
        </Grid.Item>
        <Grid.Item
          full
          className="unsupported-info"
          as={Text}
          onClick={() => setShowModal(true)}>
          <Icon icon="Info" />I have a wallet type not supported here
        </Grid.Item>
        <Grid.Item
          className="advanced-options"
          full
          as={Text}
          onClick={() => setShowAdvanced(!showAdvanced)}>
          Advanced{' '}
          <Icon
            display="inline-block"
            icon={showAdvanced ? 'ChevronNorth' : 'ChevronSouth'}
            size="14px"
            color={'black'}
          />
        </Grid.Item>
        {showAdvanced ? (
          <Grid.Item
            full
            as={Box}
            onClick={() => setSkipLoginSigning(!skipLoginSigning)}>
            <Box className="skip-signing">
              <Checkbox
                selected={skipLoginSigning}
                onClick={() => setSkipLoginSigning(!skipLoginSigning)}
              />
              <Text>Skip Signing on Login</Text>
            </Box>
          </Grid.Item>
        ) : null}
        <Modal show={showModal} hide={() => setShowModal(false)}>
          <Box className="info-modal-content">
            <div className="fw-bold mb5">Other Wallet Types</div>
            <div className="mb5">
              All other wallet types are now supported via Metamask or
              WalletConnect.
            </div>
            <div className="mb5">
              If you are you using a{' '}
              <span className="fw-bold">
                Hardware Wallet, Ethereum Keystore, or Ethereum Private Key,
              </span>{' '}
              please use Metamask going forward.
            </div>
            <div className="mb5">
              Refer to{' '}
              <Text
                as="a"
                style={{ textDecoration: 'underline' }}
                href="https://metamask.zendesk.com/hc/en-us/articles/360020394612-How-to-connect-a-Trezor-or-Ledger-Hardware-Wallet"
                target="_blank">
                Metamask's guide
              </Text>{' '}
              on how to connect these wallets with Metamask.
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
