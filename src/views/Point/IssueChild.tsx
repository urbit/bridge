import React, { useCallback, useEffect, useMemo, useState } from 'react';
import cn from 'classnames';
import { Button, Grid } from 'indigo-react';
import Window from 'components/L2/Window/Window';
import HeaderPane from 'components/L2/Window/HeaderPane';
import BodyPane from 'components/L2/Window/BodyPane';

import * as azimuth from 'azimuth-js';
import ob from 'urbit-ob';
import { Box, Icon, Row, Text } from '@tlon/indigo-react';

import { useNetwork } from 'store/network';
import { usePointCache } from 'store/pointCache';
import { usePointCursor } from 'store/pointCursor';
import { useRollerStore } from 'store/rollerStore';

import * as need from 'lib/need';
import useEthereumTransaction from 'lib/useEthereumTransaction';
import { GAS_LIMITS } from 'lib/constants';
import { patp2dec } from 'lib/patp2dec';
import { getSpawnCandidate } from 'lib/child';
import { useLocalRouter } from 'lib/LocalRouter';
import { validateChild } from 'lib/validators';
import { convertToInt } from 'lib/convertToInt';
import { isGalaxy } from 'lib/utils/point';
import useRoller from 'lib/useRoller';
import { L1TxnType } from 'lib/types/PendingL1Transaction';

import InlineEthereumTransaction from 'components/InlineEthereumTransaction';
import View from 'components/View';
import CopiableAddress from 'components/copiable/CopiableAddress';
import L2BackHeader from 'components/L2/Headers/L2BackHeader';
import LoadingOverlay from 'components/L2/LoadingOverlay';
import { PointInput, AddressInput } from 'form/Inputs';
import {
  composeValidator,
  buildPointValidator,
  buildAddressValidator,
  hasErrors,
} from 'form/validators';
import BridgeForm from 'form/BridgeForm';
import FormError from 'form/FormError';

import { PatpBadge } from './PatpBadge';
import { AddressButton } from '../../components/AddressButton';
import './IssueChild.scss';

export function useIssueChild() {
  const { contracts }: any = useNetwork();
  const { syncDates }: any = usePointCache();

  const _contracts = need.contracts(contracts);

  const [spawnedPoint, setSpawnedPoint] = useState<number | string | null>();

  return useEthereumTransaction(
    useCallback(
      (spawnedPoint: string | number, owner: string) => {
        setSpawnedPoint(spawnedPoint);
        return azimuth.ecliptic.spawn(_contracts, spawnedPoint, owner);
      },
      [_contracts]
    ),
    useCallback(() => syncDates(spawnedPoint), [spawnedPoint, syncDates]),
    GAS_LIMITS.DEFAULT
  );
}

export default function IssueChild() {
  const { pop }: any = useLocalRouter();
  const { api, checkForUpdates, spawnPoint } = useRoller();
  const { pointCursor }: any = usePointCursor();
  const { point } = useRollerStore();

  const _point = convertToInt(need.point(pointCursor), 10);
  const [availablePoints, setAvailablePoints] = useState<Set<number> | null>(
    null
  );
  const [candidates, setCandidates] = useState<string[]>([]);
  const [pointToSpawn, setPointToSpawn] = useState<number | null>();
  const [destinationAddress, setDestinationAddress] = useState<string | null>();
  const [l2SpawnSent, setL2SpawnSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchAvailablePoints = useCallback(async () => {
    const available = await api.getUnspawned(_point);
    setAvailablePoints(new Set(available));
  }, [_point, api]);

  const shuffle = useCallback(() => {
    const newCandidates: string[] = [];

    // 20 tries to randomize
    for (let i = 0; i < 20; i++) {
      const candidate = ob.patp(getSpawnCandidate(_point));
      if (!newCandidates.includes(candidate)) {
        newCandidates.push(candidate);
      }
      if (newCandidates.length === 3) {
        break;
      }
    }

    setCandidates(newCandidates);
  }, [_point]);

  const handleShuffleClick = useCallback(() => {
    shuffle();
  }, [shuffle]);

  useEffect(() => {
    // load the availablePoints for validation
    fetchAvailablePoints();
    // set the candidates
    shuffle();
  }, [fetchAvailablePoints, shuffle]);

  const spawnNewPoint = useCallback(async () => {
    if (pointToSpawn && destinationAddress) {
      setLoading(true);
      await spawnPoint(pointToSpawn, destinationAddress);
      checkForUpdates({ point: pointToSpawn });
      setPointToSpawn(null);
      setDestinationAddress(null);
      setL2SpawnSent(true);
      setLoading(false);
    }
  }, [pointToSpawn, destinationAddress, spawnPoint, checkForUpdates]);

  const {
    isDefaultState,
    construct,
    unconstruct,
    completed,
    inputsLocked,
    bind,
    txHashes,
  } = useIssueChild();

  useEffect(() => {
    if (completed && pointToSpawn) {
      checkForUpdates({
        point: pointToSpawn,
        l1Txn: {
          id: `${pointToSpawn}`,
          point: point.value,
          type: L1TxnType.spawn,
          hash: txHashes[0],
          time: new Date().getTime(),
        },
      });
    }
  }, [completed]); // eslint-disable-line react-hooks/exhaustive-deps

  const validateFormAsync = useCallback(
    async values => {
      const point = patp2dec(values.point);
      const hasPoint = availablePoints && availablePoints.has(point);

      if (!hasPoint) {
        return { point: 'This point cannot be spawned.' };
      }
    },
    [availablePoints]
  );

  const validateForm = useCallback(
    (values, errors) => {
      if (hasErrors(errors)) {
        return errors;
      }

      return validateFormAsync(values);
    },
    [validateFormAsync]
  );

  const validate = useMemo(
    () =>
      composeValidator(
        {
          point: buildPointValidator(4, [validateChild(ob.patp(_point))]),
          owner: buildAddressValidator(),
        },
        validateForm
      ),
    [_point, validateForm]
  );

  const onValues = useCallback(
    ({ valid, values }) => {
      if (valid) {
        construct(patp2dec(values.point), values.owner);
      } else {
        unconstruct();
      }

      try {
        setPointToSpawn(patp2dec(values.point));
      } catch (err) {
        setPointToSpawn(null);
      }

      setDestinationAddress(values.owner);
    },
    [construct, unconstruct]
  );

  const validPoint =
    pointToSpawn && availablePoints && availablePoints.has(pointToSpawn);
  const validAddress =
    destinationAddress && !buildAddressValidator()(destinationAddress);

  const pointType = point.isStar ? 'planet' : 'star';

  const getButtonText = () => {
    if (!validPoint) {
      return `Please enter a valid ${pointType}`;
    } else if (!validAddress) {
      return `Please enter a valid destination address`;
    }
    return `Spawn ${ob.patp(pointToSpawn)}`;
  };

  return (
    <View
      pop={pop}
      hideBack
      inset
      className="issue-child"
      header={<L2BackHeader hideBalance={point.isL2Spawn} back={pop} />}>
      <Window className="id-issue-child">
        <HeaderPane>
          <Row>
            <h5>Spawn {isGalaxy(_point) ? 'Star' : 'Planet'}</h5>
          </Row>
        </HeaderPane>
        <BodyPane>
          <Box className="inner-container">
            <BridgeForm
              className="w-full"
              validate={validate}
              onValues={onValues}>
              {({ handleSubmit, values }: any) => (
                <>
                  {(completed || l2SpawnSent) && (
                    <Grid.Item
                      full
                      as={'div'}
                      style={{ fontSize: 14 }}
                      className={cn('f5 wrap', {
                        green3: completed,
                      })}>
                      <span className="mono">{values.point}</span> has been
                      spawned and can be claimed by{' '}
                      <CopiableAddress>{values.owner}</CopiableAddress>.
                      <Grid.Item
                        as={Button}
                        full
                        className="mt6"
                        center
                        solid
                        onClick={() => pop()}>
                        Go back
                      </Grid.Item>
                    </Grid.Item>
                  )}

                  {!(completed || l2SpawnSent) && (
                    <>
                      <Grid.Item
                        full
                        as={PointInput}
                        name="point"
                        disabled={inputsLocked}
                        className="mt4"
                      />

                      {isDefaultState && candidates.length > 0 && (
                        <>
                          <Text className={'input-hint'}>Perhaps:</Text>
                          <Row>
                            <Box className={'patp-badge-container'}>
                              <Box className="badges">
                                {candidates.map(p => (
                                  <PatpBadge className={'patp-badge'} key={p}>
                                    {p}
                                  </PatpBadge>
                                ))}
                              </Box>
                              <Box className="shuffle">
                                <Icon
                                  size={16}
                                  icon="ArrowRefresh"
                                  onClick={handleShuffleClick}></Icon>
                              </Box>
                            </Box>
                          </Row>
                        </>
                      )}

                      <Grid.Item
                        full
                        as={AddressInput}
                        className="mb4"
                        name="owner"
                        label="Ethereum Address"
                        disabled={inputsLocked}
                      />
                      {isDefaultState && (
                        <Box>
                          <AddressButton inputName="owner">
                            Use my address
                          </AddressButton>
                        </Box>
                      )}
                      <Grid.Item full as={FormError} />

                      {point.isL2Spawn ? (
                        <Grid.Item
                          as={Button}
                          full
                          className="mt4"
                          center
                          solid
                          disabled={!validPoint || !validAddress}
                          onClick={spawnNewPoint}>
                          {getButtonText()}
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
                </>
              )}
            </BridgeForm>
          </Box>
        </BodyPane>
      </Window>
      <LoadingOverlay loading={loading} />
    </View>
  );
}
