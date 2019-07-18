import React from 'react';
import { B } from 'indigo-react';

import { DownloadButton } from 'components/Buttons';

export default function DownloadKeyfileButton({
  // useKeyfileGenerator.bind
  generating,
  available,
  downloaded,
  download,

  // from caller
  className,
  ...rest
}) {
  const showHelp = !generating && !available;

  return (
    <DownloadButton
      as="span"
      className={className}
      disabled={downloaded || !available}
      disabledDetail={
        showHelp && (
          <B className="wrap ws-normal">
            · Custom or nondeterministic networking keys cannot be
            re-downloaded.
          </B>
        )
      }
      loading={generating}
      onClick={download}
      {...rest}>
      Download Arvo Keyfile
    </DownloadButton>
  );
}
