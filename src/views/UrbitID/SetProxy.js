import React, { useCallback, useEffect, useMemo, useState } from 'react';
import cn from 'classnames';
import { Grid, Text, Flex, Button } from 'indigo-react';
import * as azimuth from 'azimuth-js';

import './SetProxy.scss';

import { useNetwork } from 'store/network';
import { usePointCache } from 'store/pointCache';
import { usePointCursor } from 'store/pointCursor';
import { useRollerStore } from 'store/rollerStore';

import {
  PROXY_TYPE,
  proxyTypeToHuman,
  proxyTypeToHumanDescription,
} from 'lib/proxy';
import * as need from 'lib/need';
import { useLocalRouter } from 'lib/LocalRouter';
import { eqAddr, isZeroAddress } from 'lib/utils/address';
import { capitalize } from 'lib/capitalize';
import useEthereumTransaction from 'lib/useEthereumTransaction';
import useRoller from 'lib/useRoller';

import InlineEthereumTransaction from 'components/InlineEthereumTransaction';
import { ETH_ZERO_ADDR, GAS_LIMITS } from 'lib/constants';
import { AddressInput } from 'form/Inputs';
import {
  composeValidator,
  buildCheckboxValidator,
  buildAddressValidator,
} from 'form/validators';
import BridgeForm from 'form/BridgeForm';
import FormError from 'form/FormError';
import Window from 'components/L2/Window/Window';
import HeaderPane from 'components/L2/Window/HeaderPane';
import BodyPane from 'components/L2/Window/BodyPane';
import { Row } from '@tlon/indigo-react';

const getL2ProxyName = proxy =>
  proxy === PROXY_TYPE.MANAGEMENT
    ? 'manage'
    : proxy === PROXY_TYPE.SPAWN
    ? 'spawn'
    : proxy === PROXY_TYPE.TRANSFER
    ? 'transfer'
    : '';

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

const getButtonText = proxyType => {
  switch (proxyType) {
    case PROXY_TYPE.MANAGEMENT:
      return 'Set Management Proxy';
    case PROXY_TYPE.SPAWN:
      return 'Set Spawn Proxy';
    case PROXY_TYPE.TRANSFER:
      return 'Set Transfer Proxy';
    default:
      return 'Set Management Proxy';
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
  const { contracts } = useNetwork();
  const { point, setLoading } = useRollerStore();
  const {
    setProxyAddress,
    getPendingTransactions,
    checkForUpdates,
  } = useRoller();
  const [newAddress, setNewAddress] = useState('');

  const _contracts = need.contracts(contracts);

  const humanProxyType = proxyTypeToHuman(data.proxyType);
  const properProxyType = capitalize(humanProxyType);

  const { isL2, isL2Spawn } = point;

  const isL2Tx =
    (data.proxyType === 'MANAGEMENT' && isL2) ||
    (data.proxyType === 'SPAWN' && isL2Spawn) ||
    (data.proxyType === 'TRANSFER' && isL2);

  const {
    construct,
    unconstruct,
    unset,
    inputsLocked,
    completed,
    bind,
  } = useSetProxy(data.proxyType);

  const setProxy = useCallback(async () => {
    setLoading(true);
    if (newAddress === '') return;
    try {
      await setProxyAddress(getL2ProxyName(data.proxyType), newAddress);
      getPendingTransactions(point.value);
      pop();
    } catch (error) {
      // setError(error);
    } finally {
      setLoading(false);
    }
  }, [
    newAddress,
    getPendingTransactions,
    point,
    pop,
    data.proxyType,
    setProxyAddress,
    setLoading,
  ]);

  useEffect(() => {
    if (completed) {
      checkForUpdates(
        point.value,
        `${point.patp}'s ${humanProxyType} proxy has been set!`
      );
    }
  }, [completed]); // eslint-disable-line react-hooks/exhaustive-deps

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
          setNewAddress('');
        } else {
          construct(values.address);
          setNewAddress(values.address);
        }
      } else {
        unconstruct();
      }
    },
    [construct, unconstruct, unset, setNewAddress]
  );

  const initialValues = useMemo(() => ({ unset: false }), []);

  const proxyAddress = proxyFromDetails(point, _contracts, data.proxyType);
  const isProxySet = !isZeroAddress(proxyAddress);

  const header = useMemo(() => {
    const pfix = completed ? 'New' : 'Edit';
    return `${pfix} ${properProxyType} Key`;
  }, [completed, properProxyType]);

  return (
    <Window>
      <HeaderPane>
        <Row className="header-row">
          <h5>{header}</h5>
        </Row>
      </HeaderPane>
      <BodyPane>
        <Grid className="w-full">
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

                {isL2Tx ? (
                  <Grid.Item
                    as={Button}
                    full
                    className="set-proxy"
                    center
                    solid
                    disabled={values.unset}
                    onClick={setProxy}>
                    {getButtonText(data.proxyType)}
                  </Grid.Item>
                ) : (
                  <Grid.Item
                    full
                    as={InlineEthereumTransaction}
                    {...bind}
                    onReturn={() => pop()}
                  />
                )}
              </>
            )}
          </BridgeForm>
        </Grid>
      </BodyPane>
    </Window>
  );
}
