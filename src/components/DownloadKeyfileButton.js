import React from 'react';
import { Flex, B } from 'indigo-react';

import useKeyfileGenerator from 'lib/useKeyfileGenerator';

import { DownloadButton } from 'components/Buttons';

export default function DownloadKeyfileButton({
  networkSeed,
  className,
  ...rest
}) {
  const { generating, available, downloaded, download } = useKeyfileGenerator(
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
