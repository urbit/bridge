import React, { useState, useCallback } from 'react';
import { Nothing } from 'folktale/maybe';

import View from 'components/View';
import { ForwardButton, DownloadButton } from 'components/Buttons';

import { useLocalRouter } from 'lib/LocalRouter';
import { downloadWallet } from 'lib/invite';

export default function Download({ newWallet }) {
  const { push, names } = useLocalRouter();

  const [hasDownloaded, setHasDownloaded] = useState(false);

  const doDownload = () => {
    downloadWallet(newWallet.value.paper);
    setHasDownloaded(true);
  };

  const next = useCallback(() => push(names.VERIFY), [push, names]);

  return (
    <View>
      Download the thing, and keep it somewhere safe!
      <DownloadButton
        disabled={Nothing.hasInstance(newWallet)}
        onClick={doDownload}>
        Download
      </DownloadButton>
      <ForwardButton disabled={!hasDownloaded} onClick={next}>
        Continue
      </ForwardButton>
    </View>
  );
}
