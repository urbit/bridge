import React, { useCallback, useState } from 'react';
import { Nothing } from 'folktale/maybe';
import { Grid, Text, H5, Flex } from 'indigo-react';

import { usePointCursor } from 'store/pointCursor';
import { usePointCache } from 'store/pointCache';

import { useLocalRouter } from 'lib/LocalRouter';
import * as need from 'lib/need';
import { segmentNetworkKey } from 'lib/keys';
import { formatDotsWithTime } from 'lib/dateFormat';

import ViewHeader from 'components/ViewHeader';
import MiniBackButton from 'components/MiniBackButton';
import {
  GenerateButton,
  BootArvoButton,
  ForwardButton,
} from 'components/Buttons';
import FooterButton from 'components/FooterButton';
import WarningBox from 'components/WarningBox';
import DownloadKeyfileButton from 'components/DownloadKeyfileButton';

const renderNetworkKey = key => {
  const segments = segmentNetworkKey(key);

  if (!segments) {
    return 'Unset';
  }

  return segments.join('\n');
};

function useSetKeys() {
  const setting = false;
  const didSet = false;
  const setKeys = useCallback(async () => {}, []);

  return {
    setting,
    didSet,
    setKeys,
  };
}

export default function AdminNetworkingKeys() {
  const { push, names, pop } = useLocalRouter();
  const { pointCursor } = usePointCursor();
  const { getDetails, getRekeyDate } = usePointCache();

  const point = need.point(pointCursor);
  const details = getDetails(point);

  const hasKeys = details.matchWith({
    Nothing: () => false,
    Just: ({ value: details }) => parseInt(details.keyRevisionNumber, 10) > 0,
  });
  const [configuring, setConfiguring] = useState(false);

  const { setKeys, setting, didSet } = useSetKeys();

  const goRelocate = useCallback(() => push(names.RELOCATE), [push, names]);
  const configureTransaction = useCallback(() => setConfiguring(true), [
    setConfiguring,
  ]);

  const inDefaultState = !configuring && !setting && !didSet;

  const renderTitle = () => {
    if (didSet) {
      return 'Networking keys are now set. Download your Keyfile to authenticate Arvo.';
    }

    if (setting) {
      return 'Setting Network Keys...';
    }

    if (!hasKeys) {
      return 'Networking keys have not yet been set.';
    }

    return 'Networking';
  };

  const renderButton = () => {
    if (didSet) {
      return <Grid.Item full as={DownloadKeyfileButton} solid />;
    }

    if (configuring || setting) {
      return <Grid.Item full as={GenerateButton} solid onClick={setKeys} />;
    }

    return (
      <Grid.Item full as={ForwardButton} solid onClick={configureTransaction}>
        {hasKeys ? 'Reset' : 'Set'} Networking Keys
      </Grid.Item>
    );
  };

  const renderNetworkKeySection = (title, key) => (
    <>
      <Grid.Item full as={H5} className="mt3 gray4">
        {title}
      </Grid.Item>
      {key.matchWith({
        Nothing: () => (
          <Grid.Item full as={Text} className="f5 gray4">
            Unset
          </Grid.Item>
        ),
        Just: ({ value: key }) => (
          <>
            <Grid.Item full as="code" className="f5 wrap">
              0x
            </Grid.Item>
            <Grid.Item full as="code" className="f5 wrap">
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

  const renderDetails = () => {
    return (
      <>
        {renderNetworkKeySection(
          'Authentication',
          details.map(d => d.authenticationKey)
        )}
        {renderNetworkKeySection(
          'Encryption',
          details.map(d => d.encryptionKey)
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
  };

  return (
    <>
      <Grid>
        <Grid.Item full as={MiniBackButton} onClick={() => pop()} />

        <Grid.Item full as={ViewHeader}>
          {renderTitle()}
        </Grid.Item>

        {inDefaultState && (
          <Grid.Item full as={Text} className="mb3">
            {hasKeys
              ? 'Here are your public keys that authenticate your Arvo.'
              : 'Set your networking keys to authenticate with Arvo.'}
          </Grid.Item>
        )}

        {didSet && (
          <Grid.Item full as={WarningBox} className="mb3">
            You need this keyfile to authenticate with Arvo.
          </Grid.Item>
        )}

        {renderButton()}

        {inDefaultState && renderDetails()}

        {didSet && (
          <>
            <Grid.Item full as={BootArvoButton} disabled />
            <Grid.Divider />
          </>
        )}
      </Grid>

      {inDefaultState && (
        <FooterButton onClick={goRelocate} disabled>
          Relocate
        </FooterButton>
      )}
    </>
  );
}
