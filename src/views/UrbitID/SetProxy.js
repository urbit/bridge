import React, { useCallback, useMemo } from 'react';
import cn from 'classnames';
import { Grid, Text, Flex } from 'indigo-react';
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
import useEthereumTransaction from 'lib/useEthereumTransaction';

import InlineEthereumTransaction from 'components/InlineEthereumTransaction';
import { GAS_LIMITS } from 'lib/constants';
import { AddressInput } from 'form/Inputs';
import {
  composeValidator,
  buildCheckboxValidator,
  buildAddressValidator,
} from 'form/validators';
import BridgeForm from 'form/BridgeForm';
import FormError from 'form/FormError';

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

export default function SetProxy() {
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

  const validateForm = useCallback((values, errors) => {
    if (!values.unset && errors.address) {
      return errors;
    }
  }, []);

  const validate = useMemo(
    () =>
      composeValidator(
        {
          unset: buildCheckboxValidator(),
          address: buildAddressValidator(),
        },
        validateForm
      ),
    [validateForm]
  );

  const onValues = useCallback(
    ({ valid, values, form }) => {
      if (valid) {
        if (values.unset) {
          unset();
          form.change('address', '');
        } else {
          construct(values.address);
        }
      } else {
        unconstruct();
      }
    },
    [construct, unconstruct, unset]
  );

  const initialValues = useMemo(() => ({ unset: false }), []);

  const proxyAddress = proxyFromDetails(_details, _contracts, data.proxyType);
  const isProxySet = !isZeroAddress(proxyAddress);

  const header = useMemo(() => {
    const pfix = completed ? 'New' : 'Edit';
    return `${pfix} ${properProxyType} Key`;
  }, [completed, properProxyType]);

  return (
    <Grid>
      <Grid.Item full className="f5 mb2">
        {header}
      </Grid.Item>

      {!completed && (
        <>
          <Grid.Item full as={Text} className="mb4 f5 gray4">
            {proxyTypeToHumanDescription(data.proxyType)}
          </Grid.Item>
          <Grid.Item
            full
            as={Text}
            className={cn('f6', {
              green3: completed,
            })}>
            Current
          </Grid.Item>
        </>
      )}

      <BridgeForm
        validate={validate}
        onValues={onValues}
        initialValues={initialValues}>
        {({ handleSubmit, values }) => (
          <>
            <Grid.Item full as={Flex} row justify="between" align="center">
              <Flex.Item
                flex
                as={Text}
                className={cn('mono mv3 gray4', {
                  black: !completed && isProxySet,
                  gray4: !completed && !isProxySet,
                  green3: completed,
                })}>
                {isProxySet ? proxyAddress : 'Unset'}
              </Flex.Item>
            </Grid.Item>

            {completed ? (
              <Grid.Item full className="mb4" />
            ) : (
              <Grid.Item
                full
                as={AddressInput}
                className="mv4"
                name="address"
                label={`New ${properProxyType} Address`}
                disabled={inputsLocked || values.unset}
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
