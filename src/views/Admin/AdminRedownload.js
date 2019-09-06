import React, { useCallback, useState } from 'react';
import { Just, Nothing } from 'folktale/maybe';
import * as need from 'lib/need';

import { usePointCursor } from 'store/pointCursor';

import { DownloadButton, RestartButton } from 'components/Buttons';
import PaperBuilder from 'components/PaperBuilder';

import { downloadWallet } from 'lib/invite';

import { useWallet } from 'store/wallet';
import { Grid, P } from 'indigo-react';
import ViewHeader from 'components/ViewHeader';
import { useLocalRouter } from 'lib/LocalRouter';

export default function AdminRedownload() {
  const { urbitWallet } = useWallet();
  const { pointCursor } = usePointCursor();
  const { pop } = useLocalRouter();

  const _urbitWallet = need.wallet(urbitWallet);
  const point = need.point(pointCursor);

  const [paper, setPaper] = useState(Nothing());
  const [downloaded, setDownloaded] = useState(false);

  const doDownload = useCallback(() => {
    downloadWallet(paper.value);
    setDownloaded(true);
  }, [paper, setDownloaded]);

  const goBack = useCallback(() => pop(), [pop]);

  return (
    <>
      <Grid>
        <Grid.Item full as={ViewHeader}>
          Download Passport
        </Grid.Item>
        <Grid.Item full as={P}>
          After you’ve downloaded your passport, back up the ticket manually or
          store on a trusted device.
        </Grid.Item>
        {downloaded ? (
          <Grid.Item full as={RestartButton} solid onClick={goBack}>
            Done
          </Grid.Item>
        ) : (
          <Grid.Item
            full
            as={DownloadButton}
            solid
            disabled={Nothing.hasInstance(paper)}
            onClick={doDownload}>
            {paper.matchWith({
              Nothing: () => 'Printing and folding...',
              Just: _ => 'Download paper wallet',
            })}
          </Grid.Item>
        )}
      </Grid>
      <PaperBuilder
        point={point}
        wallets={[_urbitWallet]}
        callback={paper => {
          setPaper(Just(paper));
        }}
      />
    </>
  );
}
