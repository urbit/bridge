import React, { useCallback } from 'react';
import { Just } from 'folktale/maybe';
import { Grid } from 'indigo-react';

import View from 'components/View';
import Passport from 'components/Passport';
import { OutButton } from 'components/Buttons';
import HostedShip from 'components/HostedShip';

import * as need from 'lib/need';
import { usePointCursor } from 'store/pointCursor';
import { useWallet } from 'store/wallet';
import { useLocalRouter } from 'lib/LocalRouter';
import { useHostedShip } from 'lib/useHostedShip';

export default function Hosting() {
  const { pop } = useLocalRouter();
  const { pointCursor } = usePointCursor();

  const { wallet } = useWallet();
  const point = need.point(pointCursor);
  const address = need.addressFromWallet(wallet);

  const { bind } = useHostedShip(point);

  return (
    <View pop={pop} inset>
      <Grid>
        <Passport
          point={Just(point)}
          address={Just(address)}
          animationMode={'slide'}
        />

        <Grid.Item
          full
          as={OutButton}
          href="https://urbit.org/docs/getting-started"
          detail="Run your own Urbit OS">
          Hosting Instructions
        </Grid.Item>

        <Grid.Item full as={HostedShip} {...bind} onReturn={() => pop()} />
      </Grid>
    </View>
  );
}
