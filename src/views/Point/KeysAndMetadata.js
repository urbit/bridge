import React from 'react';
import { H2, H4 } from '../../components/old/Base';

import { ETH_ZERO_ADDR, eqAddr } from '../../lib/wallet';
import Grid from 'components/Grid';

const NULL_KEY =
  '0x0000000000000000000000000000000000000000000000000000000000000000';

const renderAddress = addr =>
  eqAddr(addr, ETH_ZERO_ADDR) ? (
    <div>{'(not set)'}</div>
  ) : (
    <div>
      <div>
        <code>{addr.slice(0, 14)}</code>
      </div>
      <div>
        <code>{addr.slice(14, 28)}</code>
      </div>
      <div>
        <code>{addr.slice(28)}</code>
      </div>
    </div>
  );

const renderNetworkKey = hex => {
  const sl = i => hex.slice(i, i + 4);
  const rowFrom = i => `${sl(i)}.${sl(i + 4)}.${sl(i + 8)}.${sl(i + 12)}`;
  return hex === NULL_KEY ? (
    <div>{'(not set)'}</div>
  ) : (
    <div>
      <div>
        <code>{hex.slice(0, 2)}</code>
      </div>
      <div>
        <code>{rowFrom(2)}</code>
      </div>
      <div>
        <code>{rowFrom(18)}</code>
      </div>
      <div>
        <code>{rowFrom(34)}</code>
      </div>
      <div>
        <code>{rowFrom(50)}</code>
      </div>
    </div>
  );
};

const KeysAndMetadata = props => {
  const { pointDetails } = props;

  return (
    <Grid>
      <Grid.Item full>
        <H2>{'Ownership and Proxy Addresses'}</H2>
      </Grid.Item>
      <Grid.Item fourth={1}>
        <H4>{'Owner'}</H4>
        {pointDetails.matchWith({
          Nothing: () => <div />,
          Just: deets => renderAddress(deets.value.owner),
        })}
      </Grid.Item>
      <Grid.Item fourth={2}>
        <H4>{'Transfer Proxy'}</H4>
        {pointDetails.matchWith({
          Nothing: () => <div />,
          Just: deets => renderAddress(deets.value.transferProxy),
        })}
      </Grid.Item>
      <Grid.Item fourth={3}>
        <H4>{'Spawn Proxy'}</H4>
        {pointDetails.matchWith({
          Nothing: () => <div />,
          Just: deets => renderAddress(deets.value.spawnProxy),
        })}
      </Grid.Item>
      <Grid.Item fourth={4}>
        <H4>{'Mgmt Proxy'}</H4>
        {pointDetails.matchWith({
          Nothing: () => <div />,
          Just: deets => renderAddress(deets.value.managementProxy),
        })}
      </Grid.Item>
      <Grid.Item full>
        <UrbitNetworking pointDetails={pointDetails} />
      </Grid.Item>
    </Grid>
  );
};

const UrbitNetworking = props => {
  const { pointDetails } = props;

  const booted = pointDetails.matchWith({
    Nothing: _ => false,
    Just: details => details.value.keyRevisionNumber > 0,
  });

  const body = !booted ? (
    <div>{'(not set)'}</div>
  ) : (
    <Grid>
      <Grid.Item third={1}>
        <H4>{'Authentication'}</H4>
        {pointDetails.matchWith({
          Nothing: () => <div />,
          Just: deets => renderNetworkKey(deets.value.authenticationKey),
        })}
      </Grid.Item>
      <Grid.Item third={2}>
        <H4>{'Encryption'}</H4>
        {pointDetails.matchWith({
          Nothing: () => <div />,
          Just: deets => renderNetworkKey(deets.value.encryptionKey),
        })}
      </Grid.Item>
      <Grid.Item third={3}>
        <H4>{'Revision'}</H4>
        {pointDetails.matchWith({
          Nothing: () => '-',
          Just: deets => deets.value.keyRevisionNumber,
        })}

        <H4>{'Continuity era'}</H4>
        {pointDetails.matchWith({
          Nothing: () => '-',
          Just: deets => deets.value.continuityNumber,
        })}

        <H4>{'Crypto suite version'}</H4>
        {pointDetails.matchWith({
          Nothing: () => '-',
          Just: deets => deets.value.cryptoSuiteVersion,
        })}
      </Grid.Item>
    </Grid>
  );

  return (
    <div>
      <H2>{'Public Keys'}</H2>

      {body}
    </div>
  );
};

export default KeysAndMetadata;
