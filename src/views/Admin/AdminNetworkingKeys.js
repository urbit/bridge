import React, { useCallback, useEffect, useState } from 'react';
import { Just, Nothing } from 'folktale/maybe';
import { Grid, Text, H5, Flex } from 'indigo-react';
import * as azimuth from 'azimuth-js';
import { randomHex } from 'web3-utils';

import { usePointCursor } from 'store/pointCursor';
import { usePointCache } from 'store/pointCache';
import { useNetwork } from 'store/network';
import { useWallet } from 'store/wallet';

import { useLocalRouter } from 'lib/LocalRouter';
import * as need from 'lib/need';
import {
  segmentNetworkKey,
  attemptNetworkSeedDerivation,
  deriveNetworkKeys,
} from 'lib/keys';
import { formatDotsWithTime } from 'lib/dateFormat';
import useEthereumTransaction from 'lib/useEthereumTransaction';
import { GAS_LIMITS, ZERO_KEY, CRYPTO_SUITE_VERSION } from 'lib/constants';
import { addHexPrefix } from 'lib/wallet';

import ViewHeader from 'components/ViewHeader';
import MiniBackButton from 'components/MiniBackButton';
import { BootArvoButton, ForwardButton } from 'components/Buttons';
import FooterButton from 'components/FooterButton';
import DownloadKeyfileButton from 'components/DownloadKeyfileButton';
import InlineEthereumTransaction from 'components/InlineEthereumTransaction';
import NoticeBox from 'components/NoticeBox';

const chainKeyProp = name => d =>
  d[name] === ZERO_KEY ? Nothing() : Just(d[name]);

const renderNetworkKey = key => {
  const segments = segmentNetworkKey(key);

  if (!segments) {
    return 'Unset';
  }

  return segments.join('\n');
};

function useSetKeys() {
  const { urbitWallet, wallet, authMnemonic } = useWallet();
  const { pointCursor } = usePointCursor();
  const { syncOwnedPoint, getDetails } = usePointCache();
  const { contracts } = useNetwork();
  const _point = need.point(pointCursor);
  const _contracts = need.contracts(contracts);

  const [isDiscontinuity] = useState(false);
  // TODO: set discontinuity with radio check?
  const [ndNetworkSeed, setNdNetworkSeed] = useState();

  const { construct, broadcasting, confirmed, bind } = useEthereumTransaction(
    GAS_LIMITS.CONFIGURE_KEYS
  );

  // sync point details after success
  useEffect(() => {
    if (confirmed) {
      syncOwnedPoint(_point);
    }
  }, [_point, confirmed, syncOwnedPoint]);

  const setKeys = useCallback(async () => {
    const details = need.details(getDetails(_point));
    const networkRevision = parseInt(details.keyRevisionNumber, 10);

    console.log('setting revision to ', networkRevision + 1);

    const seed = await attemptNetworkSeedDerivation({
      urbitWallet,
      wallet,
      authMnemonic,
      details,
      revision: networkRevision + 1,
    });

    const _networkSeed = seed.matchWith({
      Nothing: () => {
        const ndSeed = randomHex(64);
        setNdNetworkSeed(ndSeed);
        return ndSeed;
      },
      Just: p => p.value,
    });

    const pair = deriveNetworkKeys(_networkSeed);

    const txn = azimuth.ecliptic.configureKeys(
      _contracts,
      _point,
      addHexPrefix(pair.crypt.public),
      addHexPrefix(pair.auth.public),
      CRYPTO_SUITE_VERSION,
      isDiscontinuity
    );

    construct(txn);
  }, [
    _contracts,
    _point,
    authMnemonic,
    construct,
    getDetails,
    isDiscontinuity,
    urbitWallet,
    wallet,
  ]);

  return {
    setKeys,
    construct,
    broadcasting,
    confirmed,
    ndNetworkSeed,
    bind,
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

  const [didRequestSetKeys, _setDidRequestSetKeys] = useState(false);
  const {
    setKeys,
    broadcasting,
    confirmed,
    ndNetworkSeed,
    bind,
  } = useSetKeys();

  const setDidRequestSetKeys = useCallback(() => {
    setKeys();
    _setDidRequestSetKeys(true);
  }, [setKeys, _setDidRequestSetKeys]);

  const goRelocate = useCallback(() => push(names.RELOCATE), [push, names]);

  const renderTitle = () => {
    if (confirmed) {
      return 'Networking keys are now set. Download your Keyfile to authenticate Arvo.';
    }

    if (broadcasting) {
      return 'Setting Network Keys...';
    }

    if (!hasKeys) {
      return 'Networking keys have not yet been set.';
    }

    return 'Networking';
  };

  const renderButton = () => {
    if (!didRequestSetKeys) {
      return (
        <Grid.Item
          full
          as={ForwardButton}
          solid
          onClick={() => setDidRequestSetKeys(true)}>
          {hasKeys ? 'Reset' : 'Set'} Networking Keys
        </Grid.Item>
      );
    }

    if (confirmed) {
      return (
        <Grid.Item
          full
          as={DownloadKeyfileButton}
          solid
          networkSeed={ndNetworkSeed}
        />
      );
    }

    return null;
  };

  const renderNetworkKeySection = (title, key) => (
    <>
      <Grid.Item full as={H5} className="mt3 gray4">
        {title}
      </Grid.Item>
      {key.matchWith({
        Nothing: () => (
          <Grid.Item full as="code" className="f5 gray4">
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
  };

  return (
    <>
      <Grid>
        <Grid.Item full as={MiniBackButton} onClick={() => pop()} />

        <Grid.Item full as={ViewHeader}>
          {renderTitle()}
        </Grid.Item>

        {!didRequestSetKeys && (
          <Grid.Item full as={Text} className="mb3">
            {hasKeys
              ? 'Here are your public keys that authenticate your Arvo.'
              : 'Set your networking keys to authenticate with Arvo.'}
          </Grid.Item>
        )}

        {confirmed && (
          <Grid.Item full as={NoticeBox} className="mb3">
            You need this keyfile to authenticate with Arvo.
          </Grid.Item>
        )}

        {renderButton()}

        {didRequestSetKeys && (
          <Grid.Item
            full
            as={InlineEthereumTransaction}
            {...bind}
            onReturn={() => pop()}
          />
        )}

        {!didRequestSetKeys && renderDetails()}

        {confirmed && (
          <>
            <Grid.Item full as={BootArvoButton} disabled />
            <Grid.Divider />
          </>
        )}
      </Grid>

      {!didRequestSetKeys && (
        <FooterButton onClick={goRelocate} disabled>
          Relocate
        </FooterButton>
      )}
    </>
  );
}
