import React, { useCallback, useEffect, useState } from 'react';
import cn from 'classnames';
import { Grid, Text, Input, Flex, LinkButton } from 'indigo-react';
import * as azimuth from 'azimuth-js';

import { useNetwork } from 'store/network';
import { usePointCache } from 'store/pointCache';
import { usePointCursor } from 'store/pointCursor';

import {
  PROXY_TYPE,
  proxyTypeToHuman,
  proxyTypeToHumanDescription,
} from 'lib/proxy';
import * as need from 'lib/need';
import { useLocalRouter } from 'lib/LocalRouter';
import { ETH_ZERO_ADDR, eqAddr } from 'lib/wallet';
import capitalize from 'lib/capitalize';
import { useAddressInput } from 'lib/useInputs';
import useEthereumTransaction from 'lib/useEthereumTransaction';

import ViewHeader from 'components/ViewHeader';
import MiniBackButton from 'components/MiniBackButton';
import InlineEthereumTransaction from 'components/InlineEthereumTransaction';
import { GAS_LIMITS } from 'lib/constants';

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

function useSetProxy(proxyType, address) {
  const { contracts } = useNetwork();
  const { pointCursor } = usePointCursor();
  const { syncOwnedPoint } = usePointCache();

  const _contracts = need.contracts(contracts);
  const _point = need.point(pointCursor);

  const [isUnsetting, setUnsetting] = useState(false);

  const buildUnsignedTx = useCallback(
    address => {
      const txArgs = [_contracts, _point, address];

      switch (proxyType) {
        case PROXY_TYPE.MANAGEMENT:
          return azimuth.ecliptic.setManagementProxy(...txArgs);
        case PROXY_TYPE.SPAWN:
          return azimuth.ecliptic.setSpawnProxy(...txArgs);
        case PROXY_TYPE.TRANSFER:
          return azimuth.ecliptic.setTransferProxy(...txArgs);
        case PROXY_TYPE.VOTING:
          return azimuth.ecliptic.setVotingProxy(...txArgs);
        default:
          throw new Error(`Unknown proxyType ${proxyType}`);
      }
    },
    [_contracts, _point, proxyType]
  );

  const {
    construct: _construct,
    confirmed,
    inputsLocked,
    bind,
  } = useEthereumTransaction(GAS_LIMITS.SET_PROXY);

  // sync point details after success
  useEffect(() => {
    if (confirmed) {
      syncOwnedPoint(_point);
    }
  }, [_point, confirmed, syncOwnedPoint]);

  // construct the unsigned transaction when we have a valid address
  const construct = useCallback(
    address => _construct(buildUnsignedTx(address)),
    [_construct, buildUnsignedTx]
  );

  // force-unset
  const unset = useCallback(() => {
    setUnsetting(true);
    _construct(buildUnsignedTx(ETH_ZERO_ADDR));
  }, [_construct, buildUnsignedTx]);

  return {
    construct,
    confirmed,
    unset,
    isUnsetting,
    inputsLocked: inputsLocked || isUnsetting,
    bind,
  };
}

export default function AdminSetProxy() {
  const { data, pop } = useLocalRouter();
  const { getDetails } = usePointCache();
  const { pointCursor } = usePointCursor();
  const point = need.point(pointCursor);
  const details = need.details(getDetails(point));

  const properProxyType = capitalize(proxyTypeToHuman(data.proxyType));

  const { construct, unset, inputsLocked, confirmed, bind } = useSetProxy(
    data.proxyType
  );
  const [addressInput, { pass, data: address }] = useAddressInput({
    name: 'address',
    label: `New ${properProxyType} Address`,
    disabled: inputsLocked,
  });

  useEffect(() => {
    if (pass) {
      construct(address);
    }
  }, [pass, address, construct]);

  const proxyAddress = proxyFromDetails(details, data.proxyType);
  const isProxySet = !eqAddr(ETH_ZERO_ADDR, proxyAddress);

  return (
    <Grid>
      <Grid.Item full as={MiniBackButton} onClick={() => pop()} />
      <Grid.Item full as={ViewHeader}>
        {properProxyType} Address
      </Grid.Item>
      <Grid.Item full as={Text} className="mb4 f5">
        {proxyTypeToHumanDescription(data.proxyType)}
      </Grid.Item>
      <Grid.Item
        full
        as={Text}
        className={cn('f6 mb1', {
          green3: confirmed,
        })}>
        {confirmed ? 'New' : 'Current'} {properProxyType} Address
      </Grid.Item>
      <Grid.Item full as={Flex} row justify="between" align="center">
        <Flex.Item
          flex
          as={Text}
          className={cn('mono', {
            black: !confirmed && isProxySet,
            gray4: !confirmed && !isProxySet,
            green3: confirmed,
          })}>
          {isProxySet ? proxyAddress : 'Unset'}
        </Flex.Item>
        {!confirmed && isProxySet && (
          <Flex.Item as={LinkButton} onClick={unset} disabled={inputsLocked}>
            Unset
          </Flex.Item>
        )}
      </Grid.Item>

      {confirmed ? (
        <Grid.Item full className="mb4" />
      ) : (
        <Grid.Item full as={Input} {...addressInput} className="mv4" />
      )}

      <Grid.Item
        full
        as={InlineEthereumTransaction}
        {...bind}
        onReturn={() => pop()}
      />
    </Grid>
  );
}
