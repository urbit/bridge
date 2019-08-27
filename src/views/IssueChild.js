import React, { useCallback, useMemo, useState } from 'react';
import cn from 'classnames';
import { Grid, Text } from 'indigo-react';
import * as azimuth from 'azimuth-js';
import * as ob from 'urbit-ob';

import { useNetwork } from 'store/network';
import { usePointCache } from 'store/pointCache';
import { usePointCursor } from 'store/pointCursor';

import * as need from 'lib/need';
import useEthereumTransaction from 'lib/useEthereumTransaction';
import { GAS_LIMITS } from 'lib/constants';
import patp2dec from 'lib/patp2dec';
import { getSpawnCandidate } from 'lib/child';
import { useLocalRouter } from 'lib/LocalRouter';
import useConstant from 'lib/useConstant';

import ViewHeader from 'components/ViewHeader';
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
import CopiableAddress from 'components/CopiableAddress';
import convertToInt from 'lib/convertToInt';

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
  const { pop } = useLocalRouter();
  const { contracts } = useNetwork();
  const { pointCursor } = usePointCursor();

  const _contracts = need.contracts(contracts);
  const _point = convertToInt(need.point(pointCursor), 10);

  const availablePointsPromise = useConstant(() =>
    azimuth.azimuth
      .getUnspawnedChildren(_contracts, _point)
      .then(points => new Set(points))
  );

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

  const validateFormAsync = useCallback(
    async values => {
      const point = patp2dec(values.point);
      const hasPoint = (await availablePointsPromise).has(point);

      if (!hasPoint) {
        return { point: 'This point cannot be spawned.' };
      }
    },
    [availablePointsPromise]
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
          point: buildPointValidator(4),
          owner: buildAddressValidator(),
        },
        validateForm
      ),
    [validateForm]
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
    <View pop={pop} inset>
      <Grid>
        <Grid.Item full as={ViewHeader}>
          Issue Child Point
        </Grid.Item>

        {isDefaultState && (
          <Grid.Item full as={Text}>
            Perhaps one of {candidates.slice(0, 3).join(', ')}, or{' '}
            {candidates[candidates.length - 1]}?
          </Grid.Item>
        )}

        <BridgeForm validate={validate} onValues={onValues}>
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
                  <Grid.Item
                    full
                    as={AddressInput}
                    className="mb4"
                    name="owner"
                    label="Ethereum Address"
                    disabled={inputsLocked}
                  />
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
      </Grid>
    </View>
  );
}
