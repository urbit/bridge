import React from 'react';
import { B } from 'indigo-react';

import { DownloadButton } from 'components/Buttons';

export default function DownloadKeyfileButton({
  // useKeyfileGenerator.bind
  generating,
  available,
  downloaded,
  download,
  notice,

  // from caller
  className,
  children = 'Download Keyfile',
  ...rest
}) {
  return (
    <DownloadButton
      as="span"
      className={className}
      disabled={!available}
      disabledDetail={
        !available && <B className="wrap ws-normal">· {notice}</B>
      }
      loading={generating}
      onClick={download}
      {...rest}>
      {children}
    </DownloadButton>
  );
}
