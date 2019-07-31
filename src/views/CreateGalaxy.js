import React, { useCallback, useEffect, useState } from 'react';
import { Nothing, Just } from 'folktale/maybe';
import cn from 'classnames';
import { Grid, Text, Input } from 'indigo-react';
import * as azimuth from 'azimuth-js';

import { useNetwork } from 'store/network';
import { usePointCache } from 'store/pointCache';

import * as need from 'lib/need';
import { useAddressInput, useGalaxyInput } from 'lib/useInputs';
import useEthereumTransaction from 'lib/useEthereumTransaction';
import { GAS_LIMITS } from 'lib/constants';
import patp2dec from 'lib/patp2dec';
import { isZeroAddress } from 'lib/wallet';
import { useLocalRouter } from 'lib/LocalRouter';

import ViewHeader from 'components/ViewHeader';
import InlineEthereumTransaction from 'components/InlineEthereumTransaction';
import View from 'components/View';

function useCreateGalaxy() {
  const { contracts } = useNetwork();
  const { syncKnownPoint } = usePointCache();

  const _contracts = need.contracts(contracts);

  const [galaxy, setGalaxy] = useState();

  return useEthereumTransaction(
    useCallback(
      (galaxy, owner) => {
        setGalaxy(galaxy);
        return azimuth.ecliptic.createGalaxy(_contracts, galaxy, owner);
      },
      [_contracts]
    ),
    useCallback(() => syncKnownPoint(galaxy), [galaxy, syncKnownPoint]),
    GAS_LIMITS.DEFAULT
  );
}

export default function CreateGalaxy() {
  const { pop } = useLocalRouter();
  const { contracts } = useNetwork();
  const _contracts = need.contracts(contracts);

  const [error, setError] = useState();
  const [isAvailable, setIsAvailable] = useState(Nothing());

  const {
    construct,
    unconstruct,
    completed,
    inputsLocked,
    bind,
  } = useCreateGalaxy();

  const [
    galaxyNameInput,
    { pass: validGalaxyName, syncPass: syncValidGalaxyName, value: galaxyName },
    // ^ we use value: here so our effect runs onChange
  ] = useGalaxyInput({
    name: 'galaxy',
    disabled: inputsLocked,
    autoFocus: true,
    error:
      error ||
      isAvailable.matchWith({
        Nothing: () => 'Loading availability...', // TODO: make async loading?
        Just: p => (p.value ? undefined : 'This galaxy is already owned.'),
      }),
  });

  const [ownerInput, { pass: validOwner, data: owner }] = useAddressInput({
    name: 'owner',
    label: `Ethereum Address`,
    disabled: inputsLocked,
  });

  useEffect(() => {
    if (validGalaxyName && validOwner) {
      construct(patp2dec(galaxyName), owner);
    } else {
      unconstruct();
    }
  }, [owner, construct, unconstruct, validGalaxyName, validOwner, galaxyName]);

  useEffect(() => {
    if (!syncValidGalaxyName || inputsLocked) {
      return;
    }

    setError();
    setIsAvailable(Nothing());

    let cancelled = false;

    (async () => {
      try {
        const currentOwner = await azimuth.azimuth.getOwner(
          _contracts,
          patp2dec(galaxyName)
        );

        const isAvailable = isZeroAddress(currentOwner);

        if (cancelled) {
          return;
        }

        setIsAvailable(Just(isAvailable));
      } catch (error) {
        console.error(error);
        setError(error.message);
        setIsAvailable(Just(false));
      }
    })();

    return () => (cancelled = true);
  }, [
    _contracts,
    galaxyName,
    inputsLocked,
    setIsAvailable,
    syncValidGalaxyName,
  ]);

  return (
    <View pop={pop} inset>
      <Grid>
        <Grid.Item full as={ViewHeader}>
          Create a Galaxy
        </Grid.Item>

        {completed && (
          <Grid.Item
            full
            as={Text}
            className={cn('f5', {
              green3: completed,
            })}>
            {galaxyName} has been created and can be claimed by {owner}.
          </Grid.Item>
        )}

        <Grid.Item full as={Input} {...galaxyNameInput} className="mt4" />
        <Grid.Item full as={Input} {...ownerInput} className="mb4" />

        <Grid.Item
          full
          as={InlineEthereumTransaction}
          {...bind}
          onReturn={() => pop()}
        />
      </Grid>
    </View>
  );
}
