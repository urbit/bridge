import React from 'react';
import { Grid, Flex, H5 } from 'indigo-react';

import { formatDotsWithTime } from 'lib/dateFormat';
import { segmentNetworkKey } from 'lib/keys';

import { usePointCache } from 'store/pointCache';
import { useRollerStore } from 'store/rollerStore';

const renderNetworkKey = key => {
  const segments = segmentNetworkKey(key);

  if (!segments) {
    return 'Not set';
  }

  return segments.join('\n');
};

export default function NetworkKeys() {
  const { getRekeyDate } = usePointCache();
  const { point } = useRollerStore();

  const {
    networkKeysSet,
    keyRevisionNumber,
    continuityNumber,
    cryptoSuiteVersion,
    authenticationKey,
    encryptionKey,
  } = point;

  const renderNetworkKeySection = (title, key) => (
    <>
      <Grid.Item full as={H5} className="mt3 gray4">
        {title}
      </Grid.Item>
      {key ? (
        <>
          <Grid.Item full as="div" className="f5 mono">
            0x
          </Grid.Item>
          <Grid.Item full as="code" className="f5 mono wrap">
            {renderNetworkKey(key)}
          </Grid.Item>
        </>
      ) : (
        <Grid.Item full as="code" className="f5 mono gray4">
          Not set
        </Grid.Item>
      )}
    </>
  );

  const renderDetail = (title, value) => (
    <Flex.Item as={Flex} row>
      <Flex.Item style={{ minWidth: 192, marginBottom: 8 }} as={H5}>
        {title}
      </Flex.Item>
      {value === 'Not set' ? (
        <Flex.Item as={H5} className="f5 gray4">
          Not set
        </Flex.Item>
      ) : (
        <Flex.Item as={H5}>{value}</Flex.Item>
      )}
    </Flex.Item>
  );

  const revisionTime = networkKeysSet
    ? ` at ${getRekeyDate(point.value)
        .map(date =>
          date.matchWith({
            Ok: r => formatDotsWithTime(r.value),
            Error: () => 'No date available',
          })
        )
        .matchWith({
          Nothing: () => null,
          Just: ({ value }) => value,
        })}`
    : '';

  return (
    <>
      <h5 className="fw-bold">Network Keys</h5>
      <h5 className="gray4">
        Revision {keyRevisionNumber} {revisionTime}
      </h5>
      {renderNetworkKeySection('Authentication Key', authenticationKey)}
      {renderNetworkKeySection('Encryption Key', encryptionKey)}
      <Grid.Item full as={Flex} col justify="between" className="mt3">
        {renderDetail('Continuity Era', continuityNumber)}
        {renderDetail('Crypto Suite Version', cryptoSuiteVersion)}
      </Grid.Item>
    </>
  );
}
