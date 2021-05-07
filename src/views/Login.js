import React, { useCallback, useState } from 'react';
import { P, H4, H5, Grid, Text, Button, Flex, LinkButton } from 'indigo-react';

import { version } from '../../package.json';

import { useHistory } from 'store/history';
import { useWallet } from 'store/wallet';
import { usePointCursor } from 'store/pointCursor';

import { WALLET_TYPES } from 'lib/wallet';
import { COMMANDS, useFlowCommand } from 'lib/flowCommand';

import View from 'components/View';
import Tabs from 'components/Tabs';
import Crumbs from 'components/Crumbs';
import Footer from 'components/Footer';
import { ForwardButton, OfflineButton } from 'components/Buttons';

import Ticket from './Login/Ticket';
import Other from './Login/Other';

const NAMES = {
  TICKET: 'TICKET',
  OTHER: 'OTHER',
};

const VIEWS = {
  [NAMES.TICKET]: Ticket,
  [NAMES.OTHER]: Other,
};

const OPTIONS = [
  { text: 'Master Ticket', value: NAMES.TICKET },
  { text: 'Other', value: NAMES.OTHER },
];

const walletTypeToViewName = walletType => {
  if (walletType === WALLET_TYPES.TICKET || !walletType) {
    return NAMES.TICKET;
  }
  return NAMES.OTHER;
};

export default function Login() {
  // globals
  const { pop, push, names } = useHistory();
  const { walletType } = useWallet();
  const { setPointCursor } = usePointCursor();
  const flow = useFlowCommand();

  // inputs
  const [isOther, setisOther] = useState(false);

  const goToActivate = useCallback(() => push(names.ACTIVATE), [
    push,
    names.ACTIVATE,
  ]);

  const goHome = useCallback(() => {
    if (!flow) {
      push(names.POINTS);
    } else {
      switch (flow.kind) {
        case COMMANDS.TAKE_LOCKUP:
          push(names.ACCEPT_LOCKUP);
        //
        case COMMANDS.BITCOIN:
          push(names.BITCOIN_SIGN_TRANSACTION);
          break;
        //
        default:
          throw new Error('unimplemented flow ' + flow.kind);
      }
    }
  }, [flow, push, names]);

  const flowDescription = command => {
    switch (command.kind) {
      case COMMANDS.TAKE_LOCKUP:
        //TODO  kind of want "sign in as 0xabc.." here...
        return <>To accept a star lockup batch, please sign in.</>;
      //
      case COMMANDS.BITCOIN:
        return <>To sign a Bitcoin transaction, please sign in.</>;
      //
      default:
        return <>Flow: {command.kind}</>;
    }
  };

  return (
    <View inset>
      <Grid>
        <Grid.Item full as={Text} className="flex justify-center mt9 mb7">
          <Grid.Item as={Text} className="gray3">
            Urbit ID /&nbsp;
          </Grid.Item>
          <Grid.Item as={Text}>Login</Grid.Item>
        </Grid.Item>
        {flow && (
          <Grid.Item full as={Text} className="t-center mb4">
            {flowDescription(flow)}
          </Grid.Item>
        )}
        <Grid.Item full as={isOther ? Other : Ticket} goHome={goHome} />
        {!isOther && (
          <>
            <Grid.Item full className="t-center mv4 gray4">
              or
            </Grid.Item>
            <Grid.Item
              full
              as={Button}
              className="b-solid b1 b-black"
              center
              onClick={() => setisOther(true)}>
              Metamask, Mnemonic, Hardware Wallet...
            </Grid.Item>
            {!flow && (
              <Grid.Item
                full
                onClick={goToActivate}
                className="mv10 t-center f6">
                <span className="gray4">New Urbit ID? </span>
                <LinkButton>Activate</LinkButton>
              </Grid.Item>
            )}
          </>
        )}
        {isOther && (
          <Grid.Item
            as={LinkButton}
            onClick={() => setisOther(false)}
            full
            className="t-center underline f6 mt8">
            Back
          </Grid.Item>
        )}
      </Grid>

      <Footer>
        <Flex className="mb8 f6" justify="between">
          <Flex.Item
            as="a"
            href="https://github.com/urbit/bridge/releases"
            className="us-none pointer">
            <span className="underline">Offline</span> ↗
          </Flex.Item>
          <Flex.Item className="gray4">v{version}</Flex.Item>
        </Flex>
      </Footer>
    </View>
  );
}
