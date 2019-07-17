import React from 'react';

import { DownloadButton } from 'components/Buttons';

import { usePointCursor } from 'store/pointCursor';

import useKeyfileGenerator from 'lib/useKeyfileGenerator';
import * as need from 'lib/need';

export default function DownloadKeyfileButton({
  networkSeed,
  className,
  ...rest
}) {
  const { pointCursor } = usePointCursor();
  const _point = need.point(pointCursor);

  const { generating, available, downloaded, download } = useKeyfileGenerator(
    _point,
    networkSeed
  );

  return (
    <DownloadButton
      className={className}
      disabled={downloaded || !available}
      loading={generating}
      onClick={download}
      {...rest}>
      Download Arvo Keyfile
    </DownloadButton>
  );
}
