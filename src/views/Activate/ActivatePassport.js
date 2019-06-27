import React, { useCallback, useState } from 'react';
import Maybe from 'folktale/maybe';
import { Grid, H4, P } from 'indigo-react';
import PaperCollateralRenderer from 'PaperCollateralRenderer';

import * as need from 'lib/need';
import { useLocalRouter } from 'lib/LocalRouter';

import View from 'components/View';
import { ForwardButton, DownloadButton } from 'components/Buttons';
import Passport from 'components/Passport';

import { useActivateFlow } from './ActivateFlow';
import { downloadWallet } from 'lib/invite';

export default function ActivatePassport() {
  const { push, names } = useLocalRouter();
  const { derivedPoint, derivedWallet } = useActivateFlow();
  // const point = need.point(derivedPoint);
  const wallet = need.wallet(derivedWallet);

  const [paper, setPaper] = useState(Maybe.Nothing());

  const goToPassport = useCallback(() => push(names.PASSPORT), [push, names]);

  const pointAsString = derivedPoint.matchWith({
    Nothing: () => '',
    Just: p => p.value.toFixed(),
  });

  const generated = paper.matchWith({
    Nothing: () => false,
    Just: () => true,
  });

  const download = useCallback(() => downloadWallet(paper.getOrElse([])), [
    paper,
  ]);

  return (
    <View.Full>
      <Grid gap={10} className="mt8 mb10" align="center">
        <Grid.Item half={1} alignSelf="center">
          <Passport point={derivedPoint} ticket={generated} />
        </Grid.Item>
        <Grid.Item half={2} as={Grid} gap={5} alignSelf="center">
          <Grid.Item full>Step 1 of 3</Grid.Item>
          <Grid.Item full as={H4}>
            Passport
          </Grid.Item>
          <Grid.Item full as={P}>
            After you’ve downloaded your passport, back up the ticket manually
            or store on a trusted device.
          </Grid.Item>
          <Grid.Item full as={P}>
            What is digital identity? A passport is your digital identity. You
            will use your passport to access your true computer, send payments,
            and administer your identity. So naturally, you must keep this
            secure.
          </Grid.Item>
          <Grid.Item
            full
            as={DownloadButton}
            disabled={!generated}
            onClick={download}
            solid>
            Download Passport
          </Grid.Item>
        </Grid.Item>
      </Grid>
      <PaperCollateralRenderer
        className="super-hidden"
        wallet={{ [pointAsString]: wallet }}
        callback={data => {
          console.log(data);
          setPaper(Maybe.Just(data));
        }}
        mode="REGISTRATION"
      />
    </View.Full>
  );
}
