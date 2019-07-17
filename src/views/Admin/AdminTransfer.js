import React, { useCallback, useEffect } from 'react';
import cn from 'classnames';
import { Grid, Text, Input } from 'indigo-react';
import * as azimuth from 'azimuth-js';

import { useNetwork } from 'store/network';
import { usePointCursor } from 'store/pointCursor';
import { usePointCache } from 'store/pointCache';

import * as need from 'lib/need';
import { useLocalRouter } from 'lib/LocalRouter';
import { useAddressInput } from 'lib/useInputs';
import useCurrentPointName from 'lib/useCurrentPointName';
import useEthereumTransaction from 'lib/useEthereumTransaction';
import { GAS_LIMITS } from 'lib/constants';

import ViewHeader from 'components/ViewHeader';
import MiniBackButton from 'components/MiniBackButton';
import InlineEthereumTransaction from 'components/InlineEthereumTransaction';

function useTransfer() {
  const { contracts } = useNetwork();
  const { pointCursor } = usePointCursor();
  const { syncOwnedPoint } = usePointCache();

  const _contracts = need.contracts(contracts);
  const _point = need.point(pointCursor);

  const {
    construct: _construct,
    unconstruct,
    confirmed,
    inputsLocked,
    bind,
  } = useEthereumTransaction(GAS_LIMITS.TRANSFER);

  const construct = useCallback(
    address =>
      _construct(
        azimuth.ecliptic.setTransferProxy(_contracts, _point, address)
      ),
    [_construct, _contracts, _point]
  );

  // sync point details after success
  useEffect(() => {
    if (confirmed) {
      syncOwnedPoint(_point);
    }
  }, [_point, confirmed, syncOwnedPoint]);

  return {
    construct,
    unconstruct,
    confirmed,
    inputsLocked,
    bind,
  };
}

export default function AdminTransfer() {
  const { pop } = useLocalRouter();
  const name = useCurrentPointName();

  const {
    construct,
    unconstruct,
    confirmed,
    inputsLocked,
    bind,
  } = useTransfer();

  const [addressInput, { pass, data: address }] = useAddressInput({
    name: 'address',
    label: `Ethereum Address`,
    disabled: inputsLocked,
  });

  useEffect(() => {
    if (pass) {
      construct(address);
    } else {
      unconstruct();
    }
  }, [pass, address, construct, unconstruct]);

  return (
    <Grid>
      <Grid.Item full as={MiniBackButton} onClick={() => pop()} />
      <Grid.Item full as={ViewHeader}>
        Transfer Point
      </Grid.Item>
      <Grid.Item
        full
        as={Text}
        className={cn('f5', {
          green3: confirmed,
        })}>
        {confirmed
          ? `${address} is now the Transfer Proxy for ${name} and can accept the transfer by logging into Multipass themselves. Until they accept your transfer, you will still have ownership over ${name}.`
          : `Transfer ${name} to a new owner.`}
      </Grid.Item>

      <Grid.Item full as={Input} {...addressInput} className="mv4" />

      <Grid.Item
        full
        as={InlineEthereumTransaction}
        {...bind}
        onReturn={() => pop()}
      />
    </Grid>
  );
}
