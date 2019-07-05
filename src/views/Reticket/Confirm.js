import React, { useState, useCallback } from 'react';
import * as need from 'lib/need';
import { Just, Nothing } from 'folktale/maybe';

import { usePointCursor } from 'store/pointCursor';

import View from 'components/View';
import { ForwardButton } from 'components/Buttons';
import PaperRenderer from 'components/PaperRenderer';

import useLifecycle from 'lib/useLifecycle';
import { generateWallet } from 'lib/invite';
import { useLocalRouter } from 'lib/LocalRouter';

import { isDevelopment } from 'lib/flags';

export default function Confirm({ newWallet, storeNewWallet }) {
  const { push, names } = useLocalRouter();
  const { pointCursor } = usePointCursor();
  const point = need.point(pointCursor);

  const [generatedWallet, setGeneratedWallet] = useState(Nothing());

  // start generating new wallet on mount
  //TODO also check we can pay for the transactions?
  useLifecycle(() => {
    (async () => {
      const wal = await generateWallet(point);
      if (isDevelopment) {
        console.log('ticket for', point, wal.ticket);
      }
      setGeneratedWallet(Just(wal));
    })();
  });

  const next = useCallback(() => push(names.DOWNLOAD), [push, names]);

  const paperRenderer = generatedWallet.matchWith({
    Nothing: () => null,
    Just: gw => (
      <PaperRenderer
        point={point}
        wallet={gw.value}
        callback={paper => {
          storeNewWallet(gw.value, paper);
        }}
      />
    ),
  });

  return (
    <View>
      Maybe we should just duplicate the Login component here? Not everyone who
      does this will be logged in with an existing ticket. Also, beware, this
      changes your proxy addresses. If you're using smart contracts, this might
      break them! It will also change your networking keys!
      <ForwardButton disabled={Nothing.hasInstance(newWallet)} onClick={next}>
        I understand, continue
      </ForwardButton>
      {paperRenderer}
    </View>
  );
}
