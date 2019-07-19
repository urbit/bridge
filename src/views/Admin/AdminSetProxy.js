import React, { useCallback, useEffect } from 'react';
import cn from 'classnames';
import { Grid, Text, Input, Flex, ToggleInput } from 'indigo-react';
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
import { ETH_ZERO_ADDR, eqAddr, isZeroAddress } from 'lib/wallet';
import capitalize from 'lib/capitalize';
import { useAddressInput, useCheckboxInput } from 'lib/useInputs';
import useEthereumTransaction from 'lib/useEthereumTransaction';

import ViewHeader from 'components/ViewHeader';
import MiniBackButton from 'components/MiniBackButton';
import InlineEthereumTransaction from 'components/InlineEthereumTransaction';
import { GAS_LIMITS } from 'lib/constants';

const proxyFromDetails = (details, contracts, proxyType) => {
  switch (proxyType) {
    case PROXY_TYPE.MANAGEMENT:
      return details.managementProxy;
    case PROXY_TYPE.SPAWN:
      return details.spawnProxy;
    case PROXY_TYPE.TRANSFER:
      return details.transferProxy;
    case PROXY_TYPE.VOTING:
      if (eqAddr(details.votingProxy, contracts.delegatedSending.address)) {
        return `${details.votingProxy} (invites contract)`;
      } else {
        return details.votingProxy;
      }
    default:
      throw new Error(`Unknown proxyType: ${proxyType}`);
  }
};

function useSetProxy(proxyType) {
  const { contracts } = useNetwork();
  const { pointCursor } = usePointCursor();
  const { syncDetails } = usePointCache();

  const _contracts = need.contracts(contracts);
  const _point = need.point(pointCursor);

  const { construct, ...rest } = useEthereumTransaction(
    useCallback(
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
    ),
    useCallback(() => syncDetails(_point), [_point, syncDetails]),
    GAS_LIMITS.SET_PROXY
  );

  // force-unset
  const unset = useCallback(() => {
    construct(ETH_ZERO_ADDR);
  }, [construct]);

  return {
    construct,
    unset,
    ...rest,
  };
}

export default function AdminSetProxy() {
  const { data, pop } = useLocalRouter();
  const { getDetails } = usePointCache();
  const { pointCursor } = usePointCursor();
  const { contracts } = useNetwork();

  const _point = need.point(pointCursor);
  const _details = need.details(getDetails(_point));
  const _contracts = need.contracts(contracts);

  const properProxyType = capitalize(proxyTypeToHuman(data.proxyType));

  const {
    construct,
    unconstruct,
    unset,
    inputsLocked,
    completed,
    bind,
  } = useSetProxy(data.proxyType);

  const [unsetInput, { data: isUnsetting }] = useCheckboxInput({
    name: 'unset',
    label: 'Unset',
    inverseLabel: 'Specify',
    initialValue: false,
    disabled: inputsLocked,
  });
  const [
    addressInput,
    { pass: validAddress, data: address },
    { reset: resetAddress },
  ] = useAddressInput({
    name: 'address',
    label: `New ${properProxyType} Address`,
    disabled: inputsLocked || isUnsetting,
  });

  useEffect(() => {
    if (isUnsetting) {
      unset();
      resetAddress();
    } else if (validAddress) {
      construct(address);
    } else {
      unconstruct();
    }
  }, [
    validAddress,
    address,
    construct,
    isUnsetting,
    unset,
    unconstruct,
    resetAddress,
  ]);

  const proxyAddress = proxyFromDetails(_details, _contracts, data.proxyType);
  const isProxySet = !isZeroAddress(proxyAddress);

  const proxyAddressLabel = `${
    completed ? 'New' : 'Current'
  } ${properProxyType} Address`;

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
          green3: completed,
        })}>
        {proxyAddressLabel}
      </Grid.Item>

      <Grid.Item full as={Flex} row justify="between" align="center">
        <Flex.Item
          flex
          as={Text}
          className={cn('mono', {
            black: !completed && isProxySet,
            gray4: !completed && !isProxySet,
            green3: completed,
          })}>
          {isProxySet ? proxyAddress : 'Unset'}
        </Flex.Item>
        {!completed && isProxySet && (
          <Flex.Item as={ToggleInput} {...unsetInput} />
        )}
      </Grid.Item>

      {completed ? (
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
