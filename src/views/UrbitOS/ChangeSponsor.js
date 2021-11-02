import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Grid } from 'indigo-react';
import * as ob from 'urbit-ob';
import { azimuth, ecliptic } from 'azimuth-js';

import { useNetwork } from 'store/network';
import { usePointCache } from 'store/pointCache';

import { PointInput } from 'form/Inputs';
import FormError from 'form/FormError';
import BridgeForm from 'form/BridgeForm';

import InlineEthereumTransaction from 'components/InlineEthereumTransaction';
import ViewHeader from 'components/ViewHeader';
import {
  composeValidator,
  buildPointValidator,
  hasErrors,
} from 'form/validators';

import * as need from 'lib/need';
import { validateMinimumPatpByteLength } from 'lib/validators';
import { usePointCursor } from 'store/pointCursor';
import useEthereumTransaction from 'lib/useEthereumTransaction';
import { isStar } from 'lib/utils/point';
import Window from 'components/L2/Window/Window';
import HeaderPane from 'components/L2/Window/HeaderPane';
import { Box, Row } from '@tlon/indigo-react';
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
  const { pointCursor } = usePointCursor();

  const _contracts = need.contracts(contracts);
  const point = need.point(pointCursor);
  const { construct, unconstruct, inputsLocked, bind } = useChangeSponsor();

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
    const sponsorSize = isStar(point) ? 1 : 2;
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
        construct(ob.patp2dec(values.sponsor));
      } else {
        unconstruct();
      }
    },
    [construct, unconstruct]
  );
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
              />
              <Grid.Item full as={FormError} />
              <Grid.Item
                full
                as={InlineEthereumTransaction}
                {...bind}
                onReturn={onDone}
                label="Request"
              />
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

  const { pointCursor } = usePointCursor();
  const { getDetails } = usePointCache();

  const point = need.point(pointCursor);

  const details = need.details(getDetails(point));

  const newSponsor = useMemo(() => ob.patp(details.escapeRequestedTo), [
    details,
  ]);

  useEffect(() => {
    construct();
  }, [construct]);
  return (
    <Grid>
      <Grid.Item full as={ViewHeader}>
        Currently requesting <span className="mono">{newSponsor}</span> as a new
        sponsor
      </Grid.Item>
      <Grid.Item
        full
        as={InlineEthereumTransaction}
        label="Cancel Request"
        {...bind}
        onReturn={onDone}
      />
    </Grid>
  );
}

export default function UrbitOSChangeSponsor() {
  const { pointCursor } = usePointCursor();

  const point = need.point(pointCursor);

  const { getDetails } = usePointCache();

  const details = need.details(getDetails(point));

  const [requested, setRequested] = useState(details.escapeRequested);

  const onDone = useCallback(() => {
    setRequested(details.escapeRequested);
  }, [details, setRequested]);

  return requested ? (
    <CurrentEscape onDone={onDone} />
  ) : (
    <ChangeSponsor onDone={onDone} />
  );
}
