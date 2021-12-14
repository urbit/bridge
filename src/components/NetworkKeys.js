import React from 'react';
import { Grid, Flex, H5 } from 'indigo-react';
import { Just, Nothing } from 'folktale/maybe';

import { formatDotsWithTime } from 'lib/dateFormat';
import { segmentNetworkKey, CURVE_ZERO_ADDR } from 'lib/keys';

import { usePointCache } from 'store/pointCache';

const chainKeyProp = name => d =>
  d[name] === CURVE_ZERO_ADDR ? Nothing() : Just(d[name]);

const renderNetworkKey = key => {
  const segments = segmentNetworkKey(key);

  if (!segments) {
    return 'Not set';
  }

  return segments.join('\n');
};

export default function NetworkKeys({ point }) {
  const { getDetails, getRekeyDate } = usePointCache();

  const details = getDetails(point);

  const hasKeys = details.matchWith({
    Nothing: () => false,
    Just: ({ value: details }) => parseInt(details.keyRevisionNumber, 10) > 0,
    // we actually don't mind the default NaN behavior of parseInt here,
    // since NaN > 0 === false and that's a reasonable result
  });

  const renderNetworkKeySection = (title, key) => (
    <>
      <Grid.Item full as={H5} className="mt3 gray4">
        {title}
      </Grid.Item>
      {key.matchWith({
        Nothing: () => (
          <Grid.Item full as="code" className="f5 mono gray4">
            Not set
          </Grid.Item>
        ),
        Just: ({ value: key }) => (
          <>
            <Grid.Item full as="div" className="f5 mono">
              0x
            </Grid.Item>
            <Grid.Item full as="code" className="f5 mono wrap">
              {renderNetworkKey(key)}
            </Grid.Item>
          </>
        ),
      })}
    </>
  );

  const renderDetail = (title, value) => (
    <Flex.Item as={Flex} row>
      <Flex.Item style={{ minWidth: 192, marginBottom: 8 }} as={H5}>
        {title}
      </Flex.Item>
      {value.matchWith({
        Nothing: () => (
          <Flex.Item as={H5} className="f5 gray4">
            Not set
          </Flex.Item>
        ),
        Just: ({ value }) => <Flex.Item as={H5}>{value}</Flex.Item>,
      })}
    </Flex.Item>
  );

  const revisionNumber = details
    .map(d => d.keyRevisionNumber)
    .matchWith({
      Nothing: () => 0,
      Just: ({ value }) => value,
    });

  const revisionTime = hasKeys
    ? ` at ${getRekeyDate(point)
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
        Revision {revisionNumber} {revisionTime}
      </h5>
      {renderNetworkKeySection(
        'Authentication Key',
        details.chain(chainKeyProp('authenticationKey'))
      )}
      {renderNetworkKeySection(
        'Encryption Key',
        details.chain(chainKeyProp('encryptionKey'))
      )}
      <Grid.Item full as={Flex} col justify="between" className="mt3">
        {renderDetail(
          'Continuity Era',
          details.map(d => d.continuityNumber)
        )}
        {renderDetail(
          'Crypto Suite Version',
          details.map(d => d.cryptoSuiteVersion)
        )}
      </Grid.Item>
    </>
  );
}
