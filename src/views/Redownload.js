import React, { useState } from 'react';
import { Just, Nothing } from 'folktale/maybe';
import * as need from 'lib/need';

import { usePointCursor } from 'store/pointCursor';

import View from 'components/View';
import { DownloadButton } from 'components/Buttons';
import PaperCollateralRenderer from 'PaperCollateralRenderer';

import { downloadWallet } from 'lib/invite';

import { useWallet } from 'store/wallet';

export default function Redownload() {
  const { urbitWallet } = useWallet();
  const { pointCursor } = usePointCursor();
  const point = need.point(pointCursor);

  const [paper, setPaper] = useState(Nothing());

  const doDownload = () => {
    downloadWallet(paper.value);
  };

  const paperRenderer = Just.hasInstance(paper) ? null : (
    <PaperCollateralRenderer
      wallet={{ [point]: urbitWallet.value }}
      className={'extremely-hidden'}
      callback={paper => {
        setPaper(Just(paper));
      }}
      mode={'REGISTRATION'}
    />
  );

  return (
    <View>
      <DownloadButton
        disabled={Nothing.hasInstance(paper)}
        onClick={doDownload}>
        {Nothing.hasInstance(paper)
          ? 'Printing and folding...'
          : 'Download paper wallet'}
      </DownloadButton>
      {paperRenderer}
    </View>
  );
}
