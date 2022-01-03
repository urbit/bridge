import React, { useCallback } from 'react';
import { Grid, Text, Flex } from 'indigo-react';

import { versionLabel } from 'lib/flags';

import { useHistory } from 'store/history';

import { COMMANDS, FlowType, useFlowCommand } from 'lib/flowCommand';

import View from 'components/View';
import Footer from 'components/Footer';

import Other from './Login/Other';

import './Login.scss';

export default function Login() {
  // globals
  const { push, names }: any = useHistory();
  const flow: any = useFlowCommand();

  const goHome = useCallback(() => {
    if (!flow) {
      push(names.POINTS);
    } else {
      switch (flow.kind) {
        case COMMANDS.TAKE_LOCKUP:
          push(names.ACCEPT_LOCKUP);
          break;
        //
        case COMMANDS.BITCOIN:
          push(names.BITCOIN_SIGN_TRANSACTION);
          break;
        //
        case COMMANDS.XPUB:
          push(names.BITCOIN_XPUB);
          break;
        //
        default:
          throw new Error('unimplemented flow ' + flow.kind);
      }
    }
  }, [flow, push, names]);

  const flowDescription = (command: FlowType) => {
    if (!command) {
      return null;
    }

    switch (command.kind) {
      case COMMANDS.TAKE_LOCKUP:
        //TODO  kind of want "sign in as 0xabc.." here...
        return <>To accept a star lockup batch, please sign in.</>;
      //
      case COMMANDS.BITCOIN:
        return <>To sign a Bitcoin transaction, please sign in.</>;
      //
      case COMMANDS.XPUB:
        return <>To view your Bitcoin extended public key, please sign in.</>;
      //
      default:
        return <>Flow: {command.kind}</>;
    }
  };

  return (
    <View inset hideBack>
      <Grid>
        <Grid.Item
          full
          as={Text}
          className="flex justify-center mt9 mb7 w-max-mobile">
          <Grid.Item as={Text}>Bridge /&nbsp;</Grid.Item>
          <Grid.Item className="fw-bold" as={Text}>
            Log In
          </Grid.Item>
        </Grid.Item>
        {flow && (
          <Grid.Item full as={Text} className="t-center mb4">
            {flowDescription(flow)}
          </Grid.Item>
        )}
        <Grid.Item
          full
          as={Other}
          goHome={goHome}
          className="login-selector w-max-mobile"
        />
      </Grid>

      <Footer>
        <Flex className="mb8 f6" justify="between">
          <Flex.Item
            as="a"
            href="https://github.com/urbit/bridge/releases"
            className="us-none pointer">
            <span className="underline">Offline</span> ↗
          </Flex.Item>
          <Flex.Item className="gray4">v{versionLabel}</Flex.Item>
        </Flex>
      </Footer>
    </View>
  );
}
