import React from 'react';
import { Grid, Flex, H5, Text } from 'indigo-react';
import { Just, Nothing } from 'folktale/maybe';

import { formatDotsWithTime } from 'lib/dateFormat';
import { segmentNetworkKey, CURVE_ZERO_ADDR } from 'lib/keys';

import { usePointCache } from 'store/pointCache';

const chainKeyProp = name => d =>
  d[name] === CURVE_ZERO_ADDR ? Nothing() : Just(d[name]);

const renderNetworkKey = key => {
  const segments = segmentNetworkKey(key);

  if (!segments) {
    return 'Unset';
  }

  return segments.join('\n');
};

export default function NetworkingKeys({ point }) {
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
            Unset
          </Grid.Item>
        ),
        Just: ({ value: key }) => (
          <>
            <Grid.Item full as="code" className="f5 mono wrap">
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
    <Flex.Item as={Flex} col>
      <Flex.Item as={H5} className="gray4">
        {title}
      </Flex.Item>
      {value.matchWith({
        Nothing: () => (
          <Flex.Item as={Text} className="f5 gray4">
            Unset
          </Flex.Item>
        ),
        Just: ({ value }) => <Flex.Item as={Text}>{value}</Flex.Item>,
      })}
    </Flex.Item>
  );

  return (
    <>
      {renderNetworkKeySection(
        'Authentication',
        details.chain(chainKeyProp('authenticationKey'))
      )}
      {renderNetworkKeySection(
        'Encryption',
        details.chain(chainKeyProp('encryptionKey'))
      )}
      <Grid.Item full as={Flex} row justify="between" className="mt3">
        {renderDetail('Revision', details.map(d => d.keyRevisionNumber))}
        {renderDetail('Continuity Era', details.map(d => d.continuityNumber))}
        {renderDetail(
          'Crypto Suite Ver.',
          details.map(d => d.cryptoSuiteVersion)
        )}
      </Grid.Item>
      {hasKeys && (
        <Grid.Item full as={Flex} row justify="between" className="mt3">
          {renderDetail(
            'Last Set',
            getRekeyDate(point).map(date =>
              date.matchWith({
                Ok: r => formatDotsWithTime(r.value),
                Error: () => Nothing(),
              })
            )
          )}
        </Grid.Item>
      )}
    </>
  );
}
