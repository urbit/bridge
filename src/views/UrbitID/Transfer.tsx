import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Grid, Text, Button } from 'indigo-react';
import * as azimuth from 'azimuth-js';

import { useNetwork } from 'store/network';
import { usePointCursor } from 'store/pointCursor';
import { usePointCache } from 'store/pointCache';
import { useStarReleaseCache } from 'store/starRelease';
import { useRollerStore } from 'store/rollerStore';

import * as need from 'lib/need';
import { useLocalRouter } from 'lib/LocalRouter';
import useCurrentPointName from 'lib/useCurrentPointName';
import useEthereumTransaction from 'lib/useEthereumTransaction';
import { GAS_LIMITS } from 'lib/constants';
import useRoller from 'lib/useRoller';

import NoticeBox from 'components/NoticeBox';
import InlineEthereumTransaction from 'components/InlineEthereumTransaction';
import { AddressInput } from 'form/Inputs';
import { composeValidator, buildAddressValidator } from 'form/validators';
import BridgeForm from 'form/BridgeForm';
import FormError from 'form/FormError';
import Window from 'components/L2/Window/Window';
import HeaderPane from 'components/L2/Window/HeaderPane';
import BodyPane from 'components/L2/Window/BodyPane';
import { L1TxnType } from 'lib/types/PendingL1Transaction';

function useTransfer() {
  const { contracts }: any = useNetwork();
  const { pointCursor }: any = usePointCursor();
  const { syncDetails }: any = usePointCache();

  const _contracts = need.contracts(contracts);
  const _point = need.point(pointCursor);

  return useEthereumTransaction(
    useCallback(
      (address: string) =>
        azimuth.ecliptic.setTransferProxy(_contracts, _point, address),
      [_contracts, _point]
    ),
    useCallback(() => syncDetails(_point), [_point, syncDetails]),
    GAS_LIMITS.SET_PROXY
  );
}

export default function AdminTransfer() {
  const { pop }: any = useLocalRouter();
  const name = useCurrentPointName();
  const { starReleaseDetails }: any = useStarReleaseCache();
  const { point } = useRollerStore();
  const {
    setProxyAddress,
    getPendingTransactions,
    checkForUpdates,
  } = useRoller();
  const [owner, setNewOwner] = useState('');

  const {
    construct,
    unconstruct,
    completed,
    inputsLocked,
    bind,
    txHashes,
  } = useTransfer();

  const needLockupWarning = useMemo(() => {
    const az = azimuth.azimuth;
    return (
      az.getPointSize(point.value) === az.PointSize.Galaxy &&
      starReleaseDetails.map((a: any) => a.kind).getOrElse('none') !== 'none'
    );
  }, [starReleaseDetails, point]);

  useEffect(() => {
    // Update this one
    if (completed) {
      checkForUpdates({
        point: point.value,
        message: `${point.patp}'s transfer proxy has been set!`,
        l1Txn: {
          id: `set-transfer-proxy-${point.value}`,
          point: point.value,
          type: L1TxnType.transferProxy,
          hash: txHashes[0],
          time: new Date().getTime(),
        },
      });
    }
  }, [completed]); // eslint-disable-line react-hooks/exhaustive-deps

  const validate = useMemo(
    () => composeValidator({ address: buildAddressValidator() }),
    []
  );

  const transferPoint = useCallback(async () => {
    // setLoading(true);
    if (owner === '') return;
    try {
      await setProxyAddress('transfer', owner);
      getPendingTransactions();
      checkForUpdates({
        point: point.value,
        message: `${point.patp}'s transfer proxy has been set!`,
      });
      pop();
    } catch (error) {
      // setError(error);
    } finally {
      // setLoading(false);
    }
  }, [
    point,
    owner,
    getPendingTransactions,
    pop,
    setProxyAddress,
    checkForUpdates,
  ]);

  const onValues = useCallback(
    ({ valid, values }) => {
      if (valid) {
        construct(values.address);
        setNewOwner(values.address);
      } else {
        unconstruct();
        setNewOwner('');
      }
    },
    [construct, unconstruct, setNewOwner]
  );

  return (
    <Window>
      <HeaderPane>
        <h5>Transfer Point</h5>
      </HeaderPane>
      <BodyPane>
        <Grid className="w-full" full gap={1}>
          <BridgeForm validate={validate} onValues={onValues}>
            {({ handleSubmit, values }) => (
              <>
                {!completed && (
                  <Grid.Item full as={Text} style={{ fontSize: 14 }}>
                    Transfer <span className="mono">{name}</span> to a new
                    owner.
                  </Grid.Item>
                )}
                {!completed && needLockupWarning && (
                  <Grid.Item full as={NoticeBox}>
                    You have stars in lockup. These will not transfer with the{' '}
                    galaxy. If you wish, you must transfer the lockup
                    separately.
                  </Grid.Item>
                )}
                {completed && (
                  <>
                    <Grid.Item full as={Text} className="wrap">
                      Started transferring <span className="mono">{name}</span>{' '}
                      to{' '}
                    </Grid.Item>
                    <Grid.Item full as={Text}>
                      <span className="mono gray4">{values.address}</span>
                    </Grid.Item>
                    <Grid.Item full as={Text} className="mt6">
                      Until they accept the transfer, you still own{' '}
                      <span className="mono">{name}</span>
                    </Grid.Item>
                  </>
                )}

                {!completed && (
                  <Grid.Item
                    full
                    as={AddressInput}
                    className="mv4"
                    name="address"
                    label="Ethereum Address"
                    disabled={inputsLocked}
                  />
                )}

                <Grid.Item full as={FormError} />

                {point.isL2 ? (
                  <Grid.Item
                    as={Button}
                    full
                    className="set-proxy"
                    center
                    solid
                    disabled={values.unset}
                    onClick={transferPoint}>
                    {'Transfer'}
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
