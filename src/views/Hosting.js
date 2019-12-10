import React from 'react';
import { Grid } from 'indigo-react';
import { Just } from 'folktale/maybe';
import ob from 'urbit-ob';

import { usePointCursor } from 'store/pointCursor';
import { useWallet } from 'store/wallet';

import * as need from 'lib/need';
import { useLocalRouter } from 'lib/LocalRouter';
import { useHostedShip } from 'lib/useHostedShip';
import SolarisClient from 'lib/SolarisClient';

import View from 'components/View';
import Passport from 'components/Passport';
import { OutButton, ForwardButton } from 'components/Buttons';
import HostedShip from 'components/HostedShip';
import Footer from 'components/Footer';

export default function Hosting() {
  const { pop } = useLocalRouter();

  const { pointCursor } = usePointCursor();
  const point = need.point(pointCursor);
  const patp = ob.patp(point);

  const { wallet } = useWallet();
  const address = need.addressFromWallet(wallet);

  const client = new SolarisClient('https://localhost:3030');
  const ship = useHostedShip(client, patp);

  return (
    <View pop={pop} inset>
      <Grid>
        <Passport
          point={Just(point)}
          address={Just(address)}
          animationMode={'slide'}
        />
        <Grid.Item full as={HostedShip} ship={ship} onReturn={() => pop()} />
        <Grid.Divider />
      </Grid>

      <Footer>
        <Grid>
          <Grid.Divider />
          <Grid.Item full as={ForwardButton} disabled={!ship.running}>
            Redirect to Urbit OS Dojo
          </Grid.Item>
          <Grid.Divider />
          <Grid.Item
            full
            as={OutButton}
            href="https://urbit.org/docs/getting-started"
            detail="Run your own Urbit OS">
            Hosting Instructions
          </Grid.Item>
        </Grid>
      </Footer>
    </View>
  );
}
