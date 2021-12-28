import React, { useCallback, useEffect, useMemo, useState } from 'react';
import cn from 'classnames';
import { Nothing } from 'folktale/maybe';
import { Grid, Text, CheckboxInput, Button } from 'indigo-react';
import * as azimuth from 'azimuth-js';

import { useNetwork } from 'store/network';
import { usePointCursor } from 'store/pointCursor';
import { usePointCache } from 'store/pointCache';
import { useWallet } from 'store/wallet';

import * as need from 'lib/need';
import useCurrentPointName from 'lib/useCurrentPointName';
import useEthereumTransaction from 'lib/useEthereumTransaction';
import { GAS_LIMITS } from 'lib/constants';
import { useLocalRouter } from 'lib/LocalRouter';
import { L1TxnType } from 'lib/types/PendingL1Transaction';

import InlineEthereumTransaction from 'components/InlineEthereumTransaction';
import View from 'components/View';
import Window from 'components/L2/Window/Window';
import HeaderPane from 'components/L2/Window/HeaderPane';
import BodyPane from 'components/L2/Window/BodyPane';
import L2BackHeader from 'components/L2/Headers/L2BackHeader';

import BridgeForm from 'form/BridgeForm';
import { composeValidator, buildCheckboxValidator } from 'form/validators';
import { Row } from '@tlon/indigo-react';
import { useRollerStore } from 'store/rollerStore';
import useRoller from 'lib/useRoller';

function useAcceptTransfer() {
  const { contracts }: any = useNetwork();
  const { pointCursor }: any = usePointCursor();
  const { syncExtras, syncControlledPoints }: any = usePointCache();
  const { wallet }: any = useWallet();

  const _contracts = need.contracts(contracts);
  const _point = need.point(pointCursor);
  const _address = need.addressFromWallet(wallet);

  const transaction = useEthereumTransaction(
    useCallback(
      (reset: boolean) =>
        azimuth.ecliptic.transferPoint(_contracts, _point, _address, reset),
      [_contracts, _point, _address]
    ),
    useCallback(
      () => Promise.all([syncExtras(_point), syncControlledPoints()]),
      [_point, syncControlledPoints, syncExtras]
    ),
    GAS_LIMITS.TRANSFER
  );

  return {
    ...transaction,
  };
}

export default function AcceptTransfer() {
  const { pop }: any = useLocalRouter();
  const { setPointCursor }: any = usePointCursor();
  const { point } = useRollerStore();
  const { transferPoint, checkForUpdates } = useRoller();

  const { wallet }: any = useWallet();
  const _address = need.addressFromWallet(wallet);

  const name = useCurrentPointName();

  const [reset, setReset] = useState(true);

  const {
    completed,
    bind,
    inputsLocked,
    construct,
    txHashes,
  } = useAcceptTransfer();

  useEffect(() => {
    // Update this one
    if (completed) {
      checkForUpdates({
        point: point.value,
        message: `${point.patp} has been transferred to you!`,
        l1Txn: {
          id: `accept-transfer-${point.value}`,
          point: point.value,
          type: L1TxnType.cancelTransfer,
          hash: txHashes[0],
          time: new Date().getTime(),
        },
      });
    }
  }, [completed]); // eslint-disable-line react-hooks/exhaustive-deps

  const initialValues = useMemo(() => ({ noReset: false }), []);

  const validate = useMemo(
    () => composeValidator({ noReset: buildCheckboxValidator() }),
    []
  );

  const onValues = useCallback(
    ({ valid, values, form }) => {
      construct(!values.noReset);
      setReset(!values.noReset);
    },
    [construct]
  );
  const goBack = useCallback(() => {
    pop();
    setPointCursor(Nothing());
  }, [pop, setPointCursor]);

  const acceptTransfer = useCallback(async () => {
    await transferPoint(_address, reset);
    await checkForUpdates({
      point: point.value,
      message: `${point.patp} has been transferred to you!`,
    });

    goBack();
  }, [goBack, transferPoint, checkForUpdates, point, _address, reset]);

  return (
    <View
      pop={pop}
      inset
      className="cancel-transfer"
      hideBack
      header={<L2BackHeader hideBalance={point.isL2} back={goBack} />}>
      <Window>
        <HeaderPane>
          <Row className="header-row">
            <h5>Accept Transfer</h5>
          </Row>
        </HeaderPane>
        <BodyPane>
          <Grid>
            <Grid.Item
              full
              as={Text}
              className={cn('f5 wrap', {
                green3: completed,
              })}>
              {completed
                ? `${name} has been accepted.`
                : `Accept the incoming transfer of ${name}.`}
            </Grid.Item>

            {!completed && (
              <BridgeForm
                validate={validate}
                initialValues={initialValues}
                onValues={onValues}>
                {() => (
                  <Grid.Item
                    full
                    as={CheckboxInput}
                    name="noReset"
                    label="Retain proxies and key configuration, in case of transferring to self"
                    disabled={inputsLocked}
                  />
                )}
              </BridgeForm>
            )}

            {point.isL2 ? (
              <Grid.Item
                as={Button}
                full
                className="set-proxy mt4"
                center
                solid
                onClick={acceptTransfer}>
                {'Accept Transfer'}
              </Grid.Item>
            ) : (
              <Grid.Item
                full
                as={InlineEthereumTransaction}
                {...bind}
                onReturn={() => goBack()}
              />
            )}
          </Grid>
        </BodyPane>
      </Window>
    </View>
  );
}
