import React, { useCallback } from 'react';
import { Grid, P, Text, Input } from 'indigo-react';
import * as azimuth from 'azimuth-js';

import { useNetwork } from 'store/network';

import * as need from 'lib/need';
import { useLocalRouter } from 'lib/LocalRouter';
import { ETH_ZERO_ADDR } from 'lib/wallet';

import ViewHeader from 'components/ViewHeader';
import { usePointCursor } from 'store/pointCursor';
import {
  PROXY_TYPE,
  proxyTypeToHuman,
  proxyTypeToHumanDescription,
} from 'lib/proxy';
import MiniBackButton from 'components/MiniBackButton';
import capitalize from 'lib/capitalize';
import { usePointCache } from 'store/pointCache';
import { GenerateButton } from 'components/Buttons';
import { useAddressInput } from 'lib/useInputs';

const proxyFromDetails = (details, proxyType) => {
  switch (proxyType) {
    case PROXY_TYPE.MANAGEMENT:
      return details.managementProxy;
    case PROXY_TYPE.SPAWN:
      return details.spawnProxy;
    case PROXY_TYPE.TRANSFER:
      return details.transferProxy;
    case PROXY_TYPE.VOTING:
      return details.votingProxy;
    default:
      throw new Error(`Unknown proxyType: ${proxyType}`);
  }
};

function useSetProxy(proxyType) {
  // TODO: abstract eth login into higher level useTransaction()
  const { contracts } = useNetwork();
  const { pointCursor } = usePointCursor();

  const buildUnsignedTx = useCallback(
    address => {
      const _contracts = need.contracts(contracts);
      const _point = need.point(pointCursor);

      const txArgs = [_contracts, _point, address];

      switch (proxyType) {
        case PROXY_TYPE.MANAGEMENT:
          return azimuth.ecliptic.setManagementProxy(...txArgs);
        case PROXY_TYPE.SPAWN:
          return azimuth.ecliptic.setSpawnProxy(...txArgs);
        case PROXY_TYPE.TRANSFER:
          return azimuth.ecliptic.setTransferProxy(...txArgs);
        case PROXY_TYPE.VOTING:
          return azimuth.ecliptic.setTransferProxy(...txArgs);
        default:
          throw new Error(`Unknown proxyType ${proxyType}`);
      }
    },
    [proxyType, contracts, pointCursor]
  );

  const generate = useCallback(async () => {
    //
  }, []);

  return {
    generate,
  };
}

export default function AdminSetProxy() {
  const { data, pop } = useLocalRouter();
  const { getDetails } = usePointCache();
  const { pointCursor } = usePointCursor();
  const point = need.point(pointCursor);
  const details = need.details(getDetails(point));

  const properProxyType = capitalize(proxyTypeToHuman(data.proxyType));

  const [addressInput, { pass }] = useAddressInput({
    name: 'address',
    label: `New ${properProxyType} Address`,
  });

  const { generate } = useSetProxy(data.proxyType);

  return (
    <Grid>
      <Grid.Item full as={MiniBackButton} onClick={() => pop()} />
      <Grid.Item full as={ViewHeader}>
        {properProxyType} Address
      </Grid.Item>
      <Grid.Item full as={P}>
        {proxyTypeToHumanDescription(data.proxyType)}
      </Grid.Item>
      <Grid.Item full as={Text} className="f6">
        Current {properProxyType} Address
      </Grid.Item>
      <Grid.Item full as={Text} className="mono">
        {proxyFromDetails(details, data.proxyType)}
      </Grid.Item>

      <Grid.Item full as={Input} {...addressInput} className="mv4" />

      <Grid.Item full as={GenerateButton} onClick={generate}>
        Generate & Sign Transaction
      </Grid.Item>
    </Grid>
  );
}
