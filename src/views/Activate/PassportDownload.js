import React, { useState, useEffect, useCallback } from 'react';
import { Just, Nothing } from 'folktale/maybe';
import { Grid, P } from 'indigo-react';

import * as need from 'lib/need';
import { downloadWallet } from 'lib/invite';
import { useLocalRouter } from 'lib/LocalRouter';

import { DownloadButton, ForwardButton } from 'components/Buttons';
import PaperRenderer from 'components/PaperRenderer';

import { useActivateFlow } from './ActivateFlow';
import PassportView from './PassportView';

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

  const [paper, setPaper] = useState(Nothing());
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
    <>
      <PassportView className={className} header="Passport" step={1}>
        <Grid>
          <Grid.Item full>
            <P>
              After you’ve downloaded your passport, back up the ticket manually
              or store on a trusted device.
            </P>
            <P>
              What is digital identity? A passport is your digital identity. You
              will use your passport to access your true computer, send
              payments, and administer your identity. So naturally, you must
              keep this secure.
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
        </Grid>
      </PassportView>
      <PaperRenderer
        point={pointAsString}
        wallet={wallet}
        callback={data => setPaper(Just(data))}
      />
    </>
  );
}
