import React, { useCallback, useMemo } from 'react';
import cn from 'classnames';
import { Grid, Text } from 'indigo-react';
import * as azimuth from 'azimuth-js';

import { useNetwork } from 'store/network';
import { usePointCursor } from 'store/pointCursor';
import { usePointCache } from 'store/pointCache';

import * as need from 'lib/need';
import { useLocalRouter } from 'lib/LocalRouter';
import useCurrentPointName from 'lib/useCurrentPointName';
import useEthereumTransaction from 'lib/useEthereumTransaction';
import { GAS_LIMITS } from 'lib/constants';

import ViewHeader from 'components/ViewHeader';
import InlineEthereumTransaction from 'components/InlineEthereumTransaction';
import { AddressInput } from 'form/Inputs';
import { composeValidator, buildAddressValidator } from 'form/validators';
import BridgeForm from 'form/BridgeForm';
import FormError from 'form/FormError';

function useTransfer() {
  const { contracts } = useNetwork();
  const { pointCursor } = usePointCursor();
  const { syncDetails } = usePointCache();

  const _contracts = need.contracts(contracts);
  const _point = need.point(pointCursor);

  return useEthereumTransaction(
    useCallback(
      address => azimuth.ecliptic.setTransferProxy(_contracts, _point, address),
      [_contracts, _point]
    ),
    useCallback(() => syncDetails(_point), [_point, syncDetails]),
    GAS_LIMITS.SET_PROXY
  );
}

export default function AdminTransfer() {
  const { pop } = useLocalRouter();
  const name = useCurrentPointName();

  const {
    construct,
    unconstruct,
    completed,
    inputsLocked,
    bind,
  } = useTransfer();

  const validate = useMemo(
    () => composeValidator({ address: buildAddressValidator() }),
    []
  );

  const onValues = useCallback(
    ({ valid, values }) => {
      if (valid) {
        construct(values.address);
      } else {
        unconstruct();
      }
    },
    [construct, unconstruct]
  );

  return (
    <Grid>
      <Grid.Item full as={ViewHeader}>
        Transfer Point
      </Grid.Item>

      <BridgeForm validate={validate} onValues={onValues}>
        {({ handleSubmit, values }) => (
          <>
            <Grid.Item
              full
              as={Text}
              className={cn('f5', {
                green3: completed,
              })}>
              {completed
                ? `${values.address} is now the Transfer Proxy for ${name} and can accept the transfer by logging into Multipass themselves. Until they accept your transfer, you will still have ownership over ${name}.`
                : `Transfer ${name} to a new owner.`}
            </Grid.Item>

            {!completed && (
              <Grid.Item
                full
                as={AddressInput}
                className="mv4"
                name="address"
                label="Ethereum Address"
                disabled={inputsLocked}
              />
            )}

            <Grid.Item full as={FormError} />

            <Grid.Item
              full
              as={InlineEthereumTransaction}
              {...bind}
              onReturn={() => pop()}
            />
          </>
        )}
      </BridgeForm>
    </Grid>
  );
}
