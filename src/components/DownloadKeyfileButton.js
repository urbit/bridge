import React from 'react';

import { DownloadButton } from 'components/Buttons';
import Blinky from 'components/Blinky';

import { usePointCursor } from 'store/pointCursor';

import useKeyfileGenerator from 'lib/useKeyfileGenerator';
import * as need from 'lib/need';

export default function DownloadKeyfileButton({ className, ...rest }) {
  const { pointCursor } = usePointCursor();
  const point = need.point(pointCursor);
  const {
    generating,
    available,
    downloaded,
    generateAndDownload,
  } = useKeyfileGenerator(point);

  return (
    <DownloadButton
      className={className}
      disabled={downloaded || !available}
      accessory={generating ? <Blinky /> : undefined}
      onClick={generateAndDownload}
      {...rest}>
      Download Arvo Keyfile
    </DownloadButton>
  );
}
