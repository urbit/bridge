import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Nothing, Just } from 'folktale/maybe';
import cn from 'classnames';
import { Grid, Text, Input } from 'indigo-react';
import * as azimuth from 'azimuth-js';
import * as ob from 'urbit-ob';

import { useNetwork } from 'store/network';
import { useHistory } from 'store/history';
import { usePointCache } from 'store/pointCache';

import * as need from 'lib/need';
import { useAddressInput, usePointInput } from 'lib/useInputs';
import useEthereumTransaction from 'lib/useEthereumTransaction';
import { GAS_LIMITS } from 'lib/constants';
import patp2dec from 'lib/patp2dec';

import ViewHeader from 'components/ViewHeader';
import MiniBackButton from 'components/MiniBackButton';
import InlineEthereumTransaction from 'components/InlineEthereumTransaction';
import View from 'components/View';
import useLifecycle from 'lib/useLifecycle';
import { usePointCursor } from 'store/pointCursor';
import { validateInSet } from 'lib/validators';
import { getSpawnCandidate } from 'lib/child';

function useIssueChild() {
  const { contracts } = useNetwork();
  const { syncKnownPoint } = usePointCache();

  const _contracts = need.contracts(contracts);

  const [spawnedPoint, setSpawnedPoint] = useState();

  return useEthereumTransaction(
    useCallback(
      (spawnedPoint, owner) => {
        setSpawnedPoint(spawnedPoint);
        return azimuth.ecliptic.spawn(_contracts, spawnedPoint, owner);
      },
      [_contracts]
    ),
    useCallback(() => syncKnownPoint(spawnedPoint), [
      spawnedPoint,
      syncKnownPoint,
    ]),
    GAS_LIMITS.DEFAULT
  );
}

export default function IssueChild() {
  const { pop } = useHistory();
  const { contracts } = useNetwork();
  const { pointCursor } = usePointCursor();

  const _contracts = need.contracts(contracts);
  const _point = parseInt(need.point(pointCursor), 10);

  const [availablePointNames, setAvailablePointNames] = useState(Nothing());

  const candidates = useMemo(() => {
    const getCandidate = () => ob.patp(getSpawnCandidate(_point));

    return [getCandidate(), getCandidate(), getCandidate(), getCandidate()];
  }, [_point]);

  const {
    isDefaultState,
    construct,
    unconstruct,
    completed,
    inputsLocked,
    bind,
  } = useIssueChild();

  const validators = useMemo(
    () => [
      validateInSet(
        availablePointNames.getOrElse(new Set()),
        'This point cannot be spawned.'
      ),
    ],
    [availablePointNames]
  );
  const [
    pointNameInput,
    { pass: validPointName, value: pointName },
    // ^ we use value: here so our effect runs onChange
  ] = usePointInput({
    name: 'point',
    disabled: inputsLocked,
    autoFocus: true,
    validators,
    error: availablePointNames.matchWith({
      Nothing: () => 'Loading availability...',
      Just: () => undefined,
    }),
  });

  const [ownerInput, { pass: validOwner, data: owner }] = useAddressInput({
    name: 'owner',
    label: `Ethereum Address`,
    disabled: inputsLocked,
  });

  useEffect(() => {
    if (validPointName && validOwner) {
      construct(patp2dec(pointName), owner);
    } else {
      unconstruct();
    }
  }, [owner, construct, unconstruct, validPointName, validOwner, pointName]);

  useLifecycle(() => {
    let mounted = true;

    (async () => {
      const availablePoints = await azimuth.azimuth.getUnspawnedChildren(
        _contracts,
        _point
      );

      if (!mounted) {
        return;
      }

      setAvailablePointNames(Just(new Set(availablePoints.map(ob.patp))));
    })();

    return () => (mounted = false);
  });

  return (
    <View inset>
      <Grid>
        <Grid.Item full as={MiniBackButton} onClick={() => pop()} />

        <Grid.Item full as={ViewHeader}>
          Issue Child Point
        </Grid.Item>

        {isDefaultState && (
          <Grid.Item full as={Text}>
            Perhaps one of {candidates.slice(0, 3).join(', ')}, or{' '}
            {candidates[candidates.length - 1]}?
          </Grid.Item>
        )}

        {completed && (
          <Grid.Item
            full
            as={Text}
            className={cn('f5', {
              green3: completed,
            })}>
            {pointName} has been spawned and can be claimed by {owner}.
          </Grid.Item>
        )}

        {!completed && (
          <>
            <Grid.Item full as={Input} {...pointNameInput} className="mt4" />
            <Grid.Item full as={Input} {...ownerInput} className="mb4" />
          </>
        )}

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
