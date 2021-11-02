import React, { useCallback, useMemo, useState } from 'react';
import cn from 'classnames';
import { Grid, Text, Button } from 'indigo-react';
import * as azimuth from 'azimuth-js';
import { Row } from '@tlon/indigo-react';

import { useNetwork } from 'store/network';
import { usePointCursor } from 'store/pointCursor';
import { usePointCache } from 'store/pointCache';
import { useStarReleaseCache } from 'store/starRelease';
import { useRollerStore } from 'store/roller';

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

function useTransfer() {
  const { contracts } = useNetwork();
  const { pointCursor } = usePointCursor();
  const { syncDetails } = usePointCache();

  const _contracts = need.contracts(contracts);
  const _point = need.point(pointCursor);

  return useEthereumTransaction(
    useCallback(
      address => azimuth.ecliptic.setTransferProxy(_contracts, _point, address),
      [_contracts, _point]
    ),
    useCallback(() => syncDetails(_point), [_point, syncDetails]),
    GAS_LIMITS.SET_PROXY
  );
}

export default function AdminTransfer() {
  const { pop } = useLocalRouter();
  const name = useCurrentPointName();
  const { pointCursor } = usePointCursor();
  const { starReleaseDetails } = useStarReleaseCache();
  const { currentL2 } = useRollerStore();
  const { setProxyAddress, getPendingTransactions } = useRoller();
  const [owner, setNewOwner] = useState('');

  const {
    construct,
    unconstruct,
    completed,
    inputsLocked,
    bind,
  } = useTransfer();

  const point = need.point(pointCursor);

  const needLockupWarning = useMemo(() => {
    const az = azimuth.azimuth;
    return (
      az.getPointSize(point) === az.PointSize.Galaxy &&
      starReleaseDetails.map(a => a.kind).getOrElse('none') !== 'none'
    );
  }, [starReleaseDetails, point]);

  const validate = useMemo(
    () => composeValidator({ address: buildAddressValidator() }),
    []
  );

  const onSignTx = useCallback(async () => {
    // setLoading(true);
    if (owner === '') return;
    try {
      await setProxyAddress('transfer', owner);
      getPendingTransactions(point);
      pop();
    } catch (error) {
      // setError(error);
    } finally {
      // setLoading(false);
    }
  }, [owner, getPendingTransactions, point, pop, setProxyAddress]);

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
        <Row className="header-row">
          <h5>Transfer Point</h5>
        </Row>
      </HeaderPane>
      <BodyPane>
        <Grid style={{ width: '100%' }} full gap={1}>
          <BridgeForm validate={validate} onValues={onValues}>
            {({ handleSubmit, values }) => (
              <>
                {!completed && (
                  <Grid.Item full as={Text} className={cn('f5 wrap')}>
                    Transfer {name} to a new owner.
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
                      Started transferring <span className="mono">{name}</span>
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

                {currentL2 ? (
                  <Grid.Item
                    as={Button}
                    full
                    className="set-proxy"
                    center
                    solid
                    disabled={values.unset}
                    onClick={onSignTx}>
                    {'Sign Transaction'}
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
