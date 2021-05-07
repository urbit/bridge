import React, { useCallback } from 'react';
import { Grid } from 'indigo-react';

import { useLocalRouter } from 'lib/LocalRouter';

import View from 'components/View';
import { ForwardButton } from 'components/Buttons';

export default function Bitcoin() {
  const { pop, push, names } = useLocalRouter();

  const goXpub = useCallback(() => push(names.BITCOIN_XPUB), [push, names]);
  const goSignTransaction = useCallback(
    () => push(names.BITCOIN_SIGN_TRANSACTION),
    [push, names]
  );

  return (
    <View pop={pop} inset>
      <Grid.Item full className="mb4 f5">
        Bitcoin
      </Grid.Item>
      <Grid.Divider />
      <Grid className="pt2">
        <Grid.Item
          full
          as={ForwardButton}
          detail="Xpub for Landscape wallet"
          onClick={goXpub}>
          Xpub
        </Grid.Item>
        <Grid.Divider />
        <Grid.Item
          full
          as={ForwardButton}
          className="mt1"
          detail="Sign transaction from Landscape"
          onClick={goSignTransaction}>
          Sign Transaction
        </Grid.Item>
      </Grid>
    </View>
  );
}
