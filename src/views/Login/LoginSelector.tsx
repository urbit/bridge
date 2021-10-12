import React, { useCallback, useState } from 'react';
import cn from 'classnames';
import { Grid } from 'indigo-react';
import Window from 'components/L2/Window/Window';
import HeaderPane from 'components/L2/Window/HeaderPane';
import BodyPane from 'components/L2/Window/BodyPane';
import { Box, Button, Icon, Row, Text } from '@tlon/indigo-react';
import L2BackHeader from 'components/L2/Headers/L2BackHeader';

import './LoginSelector.scss';
import { useHistory } from 'store/history';
import Modal from 'components/L2/Modal';
import L2BackButton from 'components/L2/Headers/L2BackButton';

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
}

export default function LoginSelector({
  className,
  views,
  options,
  currentTab,
  setCurrentTab,
  // Tab props
  ...rest
}: LoginSelectorProps) {
  const { push, names }: any = useHistory();
  const [showModal, setShowModal] = useState(false);

  const goToActivate = useCallback(() => push(names.ACTIVATE), [
    push,
    names.ACTIVATE,
  ]);

  if (!currentTab) {
    return (
      <Grid className={className}>
        {options.map((option, i) => (
          <React.Fragment key={option.value}>
            <Grid.Item
              full
              className={cn('f5 pv3 rel pointer login-menu-item')}
              onClick={() => setCurrentTab(option.value)}>
              {option.text}
              {option.menuIcon}
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
            <Box className="close" onClick={() => setShowModal(false)}>
              &#215;
            </Box>
            <span>
              <span className="fw-bold">Other Wallet Types</span> <br />
              All other wallet types are now supported via Metamask or
              WalletConnect.
              <br />
              <br />
              If you are you using a{' '}
              <span className="fw-bold">
                Hardware Wallet, Ethereum Keystore, Ethereum Private Key
              </span>{' '}
              please use Metamask going forward.
              <br />
              <br />
              If you are using a{' '}
              <span className="fw-bold">non-custodial wallet</span> or{' '}
              <span className="fw-bold">mobile wallet</span>, please use
              WalletConnect going forward.
            </span>
          </Box>
        </Modal>
      </Grid>
    );
  }

  const Tab = views[currentTab];
  const currentOption = options.find(({ value }) => value === currentTab);

  return (
    <Box display="flex" flexDirection="column">
      <L2BackButton className="mb4" onBack={() => setCurrentTab(undefined)} />
      <Window>
        <HeaderPane>
          <Row className="header-row">
            <h5>{currentOption?.text}</h5>
            {currentOption?.headerIcon}
          </Row>
        </HeaderPane>
        <BodyPane className="login-body-pane">
          <Grid.Item full as={Tab} {...rest} className="login-selector" />
        </BodyPane>
      </Window>
    </Box>
  );
}
