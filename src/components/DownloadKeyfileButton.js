import React from 'react';
import { Flex, B } from 'indigo-react';

import { usePointCursor } from 'store/pointCursor';

import useKeyfileGenerator from 'lib/useKeyfileGenerator';
import * as need from 'lib/need';

import { DownloadButton } from 'components/Buttons';

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

  const showHelp = !generating && !available;

  return (
    <DownloadButton
      as="span"
      className={className}
      disabled={downloaded || !available}
      disabledDetail={
        // TODO: make this a toggle-able 'help' or something — too much space
        showHelp && (
          <Flex col>
            <Flex.Item as={B} className="wrap ws-normal">
              · You are using nondeterministic networking keys. To download your
              Arvo keyfile, either:
            </Flex.Item>
            <Flex.Item as={B} className="wrap ws-normal">
              a) Reset your networking keys, or
            </Flex.Item>
            <Flex.Item as={B} className="wrap ws-normal">
              b) Reticket to get deterministic networking keys.
            </Flex.Item>
          </Flex>
        )
      }
      loading={generating}
      onClick={download}
      {...rest}>
      Download Arvo Keyfile
    </DownloadButton>
  );
}
