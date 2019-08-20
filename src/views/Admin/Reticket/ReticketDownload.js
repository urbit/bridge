import React, { useState, useCallback } from 'react';
import { Nothing } from 'folktale/maybe';
import { Grid, Text } from 'indigo-react';

import { useLocalRouter } from 'lib/LocalRouter';
import { downloadWallet } from 'lib/invite';

import { ForwardButton, DownloadButton } from 'components/Buttons';

export default function ReticketDownload({ newWallet }) {
  const { push, names } = useLocalRouter();

  const [downloaded, setDownloaded] = useState(false);

  const download = () => {
    downloadWallet(newWallet.value.paper);
    setDownloaded(true);
  };

  const goVerify = useCallback(() => push(names.VERIFY), [push, names]);

  return (
    <Grid className="mt4">
      <Grid.Item full as={Text}>
        Download the thing, and keep it somewhere safe!
      </Grid.Item>
      <Grid.Item
        full
        as={!downloaded ? DownloadButton : ForwardButton}
        className="mt4"
        disabled={Nothing.hasInstance(newWallet)}
        onClick={!downloaded ? download : goVerify}
        success={downloaded}
        solid>
        {!downloaded ? 'Download Passport' : 'Continue'}
      </Grid.Item>
    </Grid>
  );
}
