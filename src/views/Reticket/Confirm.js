import React, { useState } from 'react';
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

export default function Confirm({ STEP_NAMES, newWallet, storeNewWallet }) {
  const { push } = useLocalRouter();
  const { pointCursor } = usePointCursor();
  const point = need.point(pointCursor);

  const [generatedWallet, setGeneratedWallet] = useState(Nothing());

  // start generating new wallet on mount
  //TODO also check we can pay for the transactions?
  useLifecycle(() => {
    generateWallet(point).then(wal => {
      if (isDevelopment) {
        console.log('ticket for', point, wal.ticket);
      }
      setGeneratedWallet(Just(wal));
    });
  });

  const next = () => {
    push(STEP_NAMES.DOWNLOAD);
  };

  const paperRenderer = Nothing.hasInstance(generatedWallet) ? null : (
    <PaperRenderer
      point={point}
      wallet={generatedWallet.value}
      callback={paper => {
        storeNewWallet(generatedWallet.value, paper);
      }}
    />
  );

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
