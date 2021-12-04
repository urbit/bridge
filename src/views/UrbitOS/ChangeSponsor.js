import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Grid, Button } from 'indigo-react';
import * as ob from 'urbit-ob';
import { azimuth, ecliptic } from 'azimuth-js';
import { Box, Row } from '@tlon/indigo-react';

import { useNetwork } from 'store/network';
import { usePointCache } from 'store/pointCache';
import { usePointCursor } from 'store/pointCursor';
import { useRollerStore } from 'store/rollerStore';
import { useHistory } from 'store/history';

import * as need from 'lib/need';
import { validateMinimumPatpByteLength } from 'lib/validators';
import useEthereumTransaction from 'lib/useEthereumTransaction';
import useRoller from 'lib/useRoller';

import { PointInput } from 'form/Inputs';
import FormError from 'form/FormError';
import BridgeForm from 'form/BridgeForm';
import {
  composeValidator,
  buildPointValidator,
  hasErrors,
} from 'form/validators';
import InlineEthereumTransaction from 'components/InlineEthereumTransaction';
import Window from 'components/L2/Window/Window';
import HeaderPane from 'components/L2/Window/HeaderPane';
import BodyPane from 'components/L2/Window/BodyPane';

function useChangeSponsor() {
  const { contracts } = useNetwork();
  const { pointCursor } = usePointCursor();
  const { syncExtras } = usePointCache();

  const _contracts = need.contracts(contracts);
  const point = need.point(pointCursor);

  return useEthereumTransaction(
    useCallback(sponsor => ecliptic.escape(_contracts, point, sponsor), [
      point,
      _contracts,
    ]),
    useCallback(() => {
      syncExtras(point);
    }, [syncExtras, point])
  );
}

function ChangeSponsor({ onDone }) {
  const { contracts } = useNetwork();
  const { pop } = useHistory();
  const { changeSponsor, checkForUpdates } = useRoller();
  const { point, setLoading } = useRollerStore();

  const _contracts = need.contracts(contracts);
  const { construct, unconstruct, inputsLocked, bind } = useChangeSponsor();

  const [newSponsor, setNewSponsor] = useState();

  const requestNewSponsor = useCallback(async () => {
    if (newSponsor !== undefined) {
      setLoading(true);
      await changeSponsor(newSponsor);
      checkForUpdates(
        point.value,
        `${point.patp} has requested ${ob.patp(newSponsor)} as a sponsor`
      );
      setLoading(false);
      pop();
    }
  }, [point, newSponsor, changeSponsor, setLoading, checkForUpdates, pop]);

  const validateFormAsync = useCallback(
    async values => {
      const sponsor = ob.patp2dec(values.sponsor);
      const details = await azimuth.getPoint(_contracts, sponsor);

      if (details.keyRevisionNumber === 0) {
        return { sponsor: 'Sponsor is not online' };
      }
    },
    [_contracts]
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

  const validate = useMemo(() => {
    const sponsorSize = point.isStar ? 1 : 2;
    return composeValidator(
      {
        sponsor: buildPointValidator(sponsorSize, [
          validateMinimumPatpByteLength(sponsorSize),
        ]),
      },
      validateForm
    );
  }, [validateForm, point]);

  const onValues = useCallback(
    ({ valid, values }) => {
      if (valid) {
        const sponsorPoint = ob.patp2dec(values.sponsor);
        construct(sponsorPoint);
        setNewSponsor(Number(sponsorPoint));
      } else {
        unconstruct();
        setNewSponsor(undefined);
      }
    },
    [construct, unconstruct]
  );

  const buttonText = 'Request New Sponsor';

  return (
    <Window>
      <HeaderPane>
        <Row className="header-row">
          <h5>Change Sponsor</h5>
        </Row>
      </HeaderPane>
      <BodyPane>
        <BridgeForm validate={validate} onValues={onValues}>
          {() => (
            <Box width="100%">
              <Grid.Item
                full
                as={PointInput}
                name="sponsor"
                disabled={inputsLocked}
                label="New sponsor"
                className="mv4"
                size={2}
              />
              <Grid.Item full as={FormError} />
              {point.isL2 ? (
                <Grid.Item
                  as={Button}
                  full
                  center
                  solid
                  onClick={requestNewSponsor}>
                  {buttonText}
                </Grid.Item>
              ) : (
                <Grid.Item
                  full
                  as={InlineEthereumTransaction}
                  {...bind}
                  onReturn={onDone}
                  label={buttonText}
                />
              )}
            </Box>
          )}
        </BridgeForm>
      </BodyPane>
    </Window>
  );
}

function useCancelEscape() {
  const { contracts } = useNetwork();
  const { pointCursor } = usePointCursor();
  const { syncExtras } = usePointCache();

  const _contracts = need.contracts(contracts);
  const point = need.point(pointCursor);

  return useEthereumTransaction(
    useCallback(() => ecliptic.cancelEscape(_contracts, point), [
      point,
      _contracts,
    ]),
    useCallback(() => syncExtras(point), [point, syncExtras])
  );
}

function CurrentEscape({ onDone }) {
  const { construct, bind } = useCancelEscape();
  const { point } = useRollerStore();

  const { pop } = useHistory();
  const { cancelEscape, checkForUpdates } = useRoller();
  const {
    point: { isL2 },
    setLoading,
  } = useRollerStore();

  const newSponsor = useMemo(() => ob.patp(point.escapeRequestedTo), [point]);

  useEffect(() => {
    construct();
  }, [construct]);

  const cancelRequest = useCallback(async () => {
    if (newSponsor !== undefined) {
      setLoading(true);
      await cancelEscape(newSponsor);
      checkForUpdates(point.value, `${point.patp}'s sponsor change cancelled`);
      setLoading(false);
      pop();
    }
  }, [point, newSponsor, cancelEscape, setLoading, checkForUpdates, pop]);

  const buttonText = 'Cancel Request';

  return (
    <Window>
      <HeaderPane>
        <Row className="header-row">
          <h5>Change Sponsor</h5>
        </Row>
      </HeaderPane>
      <BodyPane>
        <Box width="100%" fontSize={14} className="mb4">
          Currently requesting <span className="mono">{newSponsor}</span> as a
          new sponsor
        </Box>
        {isL2 ? (
          <Grid.Item
            as={Button}
            full
            center
            solid
            style={{ width: '100%' }}
            onClick={cancelRequest}>
            {buttonText}
          </Grid.Item>
        ) : (
          <Grid.Item
            full
            as={InlineEthereumTransaction}
            label={buttonText}
            {...bind}
            onReturn={onDone}
          />
        )}
      </BodyPane>
    </Window>
  );
}

export default function UrbitOSChangeSponsor() {
  const { point } = useRollerStore();

  const [requested, setRequested] = useState(point.escapeRequested);

  const onDone = useCallback(() => {
    setRequested(point.escapeRequested);
  }, [point, setRequested]);

  return requested ? (
    <CurrentEscape onDone={onDone} />
  ) : (
    <ChangeSponsor onDone={onDone} />
  );
}
