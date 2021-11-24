import React, { useCallback, useEffect, useMemo, useState } from 'react';
import cn from 'classnames';
import { Grid } from 'indigo-react';
import Window from 'components/L2/Window/Window';
import HeaderPane from 'components/L2/Window/HeaderPane';
import BodyPane from 'components/L2/Window/BodyPane';

import * as azimuth from 'azimuth-js';
import ob from 'urbit-ob';

import { useNetwork } from 'store/network';
import { usePointCache } from 'store/pointCache';
import { usePointCursor } from 'store/pointCursor';

import * as need from 'lib/need';
import useEthereumTransaction from 'lib/useEthereumTransaction';
import { GAS_LIMITS } from 'lib/constants';
import { patp2dec } from 'lib/patp2dec';
import { getSpawnCandidate } from 'lib/child';
import { useLocalRouter } from 'lib/LocalRouter';
import { validateChild } from 'lib/validators';

import InlineEthereumTransaction from 'components/InlineEthereumTransaction';
import View from 'components/View';
import { PointInput, AddressInput } from 'form/Inputs';
import {
  composeValidator,
  buildPointValidator,
  buildAddressValidator,
  hasErrors,
} from 'form/validators';
import BridgeForm from 'form/BridgeForm';
import FormError from 'form/FormError';
import CopiableAddress from 'components/copiable/CopiableAddress';
import { convertToInt } from 'lib/convertToInt';
import { Box, Icon, Row, Text } from '@tlon/indigo-react';
import { isGalaxy } from 'lib/utils/point';
import L2BackHeader from 'components/L2/Headers/L2BackHeader';

import './IssueChild.scss';
import { PatpBadge } from './PatpBadge';
import useRoller from 'lib/useRoller';
import { AddressButton } from './AddressButton';

export function useIssueChild() {
  const { contracts } = useNetwork();
  const { syncDates } = usePointCache();

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
    useCallback(() => syncDates(spawnedPoint), [spawnedPoint, syncDates]),
    GAS_LIMITS.DEFAULT
  );
}

export default function IssueChild() {
  const { pop } = useLocalRouter();
  const { api } = useRoller();
  const { pointCursor } = usePointCursor();

  const _point = convertToInt(need.point(pointCursor), 10);
  const [availablePoints, setAvailablePoints] = useState<Set<number> | null>(
    null
  );
  const [candidates, setCandidates] = useState<string[]>([]);

  const fetchAvailablePoints = useCallback(async () => {
    const available = await api.getUnspawned(_point);
    setAvailablePoints(new Set(available));
  }, [_point, api]);

  const shuffle = useCallback(() => {
    const newCandidates = Array.from({ length: 3 }, () => {
      return ob.patp(getSpawnCandidate(_point));
    });

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

  const {
    isDefaultState,
    construct,
    unconstruct,
    completed,
    inputsLocked,
    bind,
  } = useIssueChild();

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

      return validateFormAsync(values, errors);
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
    },
    [construct, unconstruct]
  );

  return (
    <View
      pop={pop}
      hideBack
      inset
      header={<L2BackHeader hideBalance={false} back={pop} />}>
      <Window className="id-issue-child">
        <HeaderPane>
          <Row>
            <h5>Spawn {isGalaxy(_point) ? 'Star' : 'Planet'}</h5>
          </Row>
        </HeaderPane>
        <BodyPane>
          <Box className="inner-container">
            <BridgeForm
              style={{ width: '100%' }}
              validate={validate}
              onValues={onValues}>
              {({ handleSubmit, values }) => (
                <>
                  {completed && (
                    <Grid.Item
                      full
                      as={Text}
                      className={cn('f5 wrap', {
                        green3: completed,
                      })}>
                      {values.point} has been spawned and can be claimed by{' '}
                      <CopiableAddress>{values.owner}</CopiableAddress>.
                    </Grid.Item>
                  )}

                  {!completed && (
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
                          <AddressButton>Use my address</AddressButton>
                        </Box>
                      )}
                    </>
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
          </Box>
        </BodyPane>
      </Window>
    </View>
  );
}
