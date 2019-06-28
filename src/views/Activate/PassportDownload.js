import React, { useState, useEffect, useCallback } from 'react';
import Maybe from 'folktale/maybe';
import { Grid, H4, P } from 'indigo-react';
import PaperCollateralRenderer from 'PaperCollateralRenderer';

import * as need from 'lib/need';

import { useActivateFlow } from './ActivateFlow';
import { downloadWallet } from 'lib/invite';
import { DownloadButton, ForwardButton } from 'components/Buttons';
import { useLocalRouter } from 'lib/LocalRouter';
import Steps from 'components/Steps';

export default function PassportDownload({ className }) {
  const {
    derivedPoint,
    derivedWallet,
    generated,
    setGenerated,
  } = useActivateFlow();
  const { push, names } = useLocalRouter();
  // const point = need.point(derivedPoint);
  const wallet = need.wallet(derivedWallet);

  const [paper, setPaper] = useState(Maybe.Nothing());
  const [downloaded, setDownloaded] = useState(false);

  const pointAsString = derivedPoint.matchWith({
    Nothing: () => '',
    Just: p => p.value.toFixed(),
  });

  const download = useCallback(() => {
    downloadWallet(paper.getOrElse([]));
    setDownloaded(true);
  }, [paper, setDownloaded]);

  // sync paper value to activation state
  useEffect(
    () =>
      setGenerated(
        paper.matchWith({
          Nothing: () => false,
          Just: () => true,
        })
      ),
    [paper, setGenerated]
  );

  const goToVerify = useCallback(() => push(names.VERIFY), [push, names]);

  return (
    <Grid gap={4} className={className}>
      <Grid.Item full as={Steps} num={1} total={3} />
      <Grid.Item full as={H4}>
        Passport
      </Grid.Item>
      <Grid.Item full>
        <P>
          After you’ve downloaded your passport, back up the ticket manually or
          store on a trusted device.
        </P>
        <P>
          What is digital identity? A passport is your digital identity. You
          will use your passport to access your true computer, send payments,
          and administer your identity. So naturally, you must keep this secure.
        </P>
      </Grid.Item>
      <Grid.Item
        full
        as={!downloaded ? DownloadButton : ForwardButton}
        disabled={!generated}
        onClick={!downloaded ? download : goToVerify}
        success={downloaded}
        solid>
        {!downloaded ? 'Download Passport' : 'Continue'}
      </Grid.Item>
      <PaperCollateralRenderer
        className="super-hidden"
        wallet={{ [pointAsString]: wallet }}
        callback={data => {
          console.log(data);
          setPaper(Maybe.Just(data));
        }}
        mode="REGISTRATION"
      />
    </Grid>
  );
}
