import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Just } from 'folktale/maybe';
import { Grid, ToggleInput, CheckboxInput } from 'indigo-react';
import * as azimuth from 'azimuth-js';
import { randomHex } from 'web3-utils';

import { usePointCursor } from 'store/pointCursor';
import { usePointCache } from 'store/pointCache';
import { useNetwork } from 'store/network';
import { useWallet } from 'store/wallet';

import { useLocalRouter } from 'lib/LocalRouter';
import * as need from 'lib/need';
import {
  attemptNetworkSeedDerivation,
  deriveNetworkKeys,
  CRYPTO_SUITE_VERSION,
} from 'lib/keys';
import useEthereumTransaction from 'lib/useEthereumTransaction';
import { GAS_LIMITS } from 'lib/constants';
import { addHexPrefix } from 'lib/wallet';
import useKeyfileGenerator from 'lib/useKeyfileGenerator';

import ViewHeader from 'components/ViewHeader';
import DownloadKeyfileButton from 'components/DownloadKeyfileButton';
import InlineEthereumTransaction from 'components/InlineEthereumTransaction';
import NoticeBox from 'components/NoticeBox';

import { HexInput } from 'form/Inputs';
import {
  composeValidator,
  buildCheckboxValidator,
  buildHexValidator,
} from 'form/validators';
import BridgeForm from 'form/BridgeForm';
import Condition from 'form/Condition';
import FormError from 'form/FormError';
import convertToInt from 'lib/convertToInt';

function useSetKeys() {
  const { urbitWallet, wallet, authMnemonic } = useWallet();
  const { pointCursor } = usePointCursor();
  const { syncDetails, syncRekeyDate, getDetails } = usePointCache();
  const { contracts } = useNetwork();

  const _point = need.point(pointCursor);
  const _contracts = need.contracts(contracts);
  const _details = need.details(getDetails(_point));

  const networkRevision = convertToInt(_details.keyRevisionNumber, 10);
  const randomSeed = useRef();

  // NOTE: nd = 'nondeterministic' (can also be a 'manual' seed)
  const [ndNetworkSeed, setNdNetworkSeed] = useState();

  const {
    available: keyfileAvailable,
    filename,
    bind: keyfileBind,
  } = useKeyfileGenerator(ndNetworkSeed);

  const buildNetworkSeed = useCallback(
    async manualSeed => {
      if (manualSeed !== undefined) {
        setNdNetworkSeed(manualSeed);
        return manualSeed;
      } else {
        const newNetworkRevision = networkRevision + 1;
        console.log(`deriving seed with revision ${newNetworkRevision}`);

        const networkSeed = await attemptNetworkSeedDerivation({
          urbitWallet,
          wallet,
          authMnemonic,
          details: _details,
          revision: newNetworkRevision,
        });

        if (Just.hasInstance(networkSeed)) {
          return networkSeed.value;
        }

        randomSeed.current = randomSeed.current || randomHex(32); // 32 bytes
        setNdNetworkSeed(randomSeed.current);

        return randomSeed.current;
      }
    },
    [_details, authMnemonic, networkRevision, urbitWallet, wallet]
  );

  const { completed: _completed, ...rest } = useEthereumTransaction(
    useCallback(
      async (manualSeed, isDiscontinuity) => {
        const seed = await buildNetworkSeed(manualSeed);
        const pair = deriveNetworkKeys(seed);

        return azimuth.ecliptic.configureKeys(
          _contracts,
          _point,
          addHexPrefix(pair.crypt.public),
          addHexPrefix(pair.auth.public),
          CRYPTO_SUITE_VERSION,
          isDiscontinuity
        );
      },
      [_contracts, _point, buildNetworkSeed]
    ),
    useCallback(
      () => Promise.all([syncDetails(_point), syncRekeyDate(_point)]),
      [_point, syncDetails, syncRekeyDate]
    ),
    GAS_LIMITS.CONFIGURE_KEYS
  );

  // only treat the transaction as completed once we also have keys to download
  const completed = _completed && keyfileAvailable;

  return {
    completed,
    ndNetworkSeed,
    filename,
    keyfileBind,
    ...rest,
  };
}

export default function UrbitOSNetworkingKeys() {
  const { push, names, pop } = useLocalRouter();
  const { pointCursor } = usePointCursor();
  const { getDetails } = usePointCache();

  const point = need.point(pointCursor);
  const details = getDetails(point);

  const hasKeys = details.matchWith({
    Nothing: () => false,
    Just: ({ value: details }) => parseInt(details.keyRevisionNumber, 10) > 0,
    // we actually don't mind the default NaN behavior of parseInt here,
    // since NaN > 0 === false and that's a reasonable result
  });

  const {
    isDefaultState,
    construct,
    unconstruct,
    broadcasting,
    completed,
    inputsLocked,
    bind,
    keyfileBind,
  } = useSetKeys();

  const validateForm = useCallback((values, errors) => {
    if (values.useNetworkSeed && errors.networkSeed) {
      return errors;
    }
  }, []);

  const validate = useMemo(
    () =>
      composeValidator(
        {
          useNetworkSeed: buildCheckboxValidator(),
          networkSeed: buildHexValidator(64), // 64 chars
          useDiscontinuity: buildCheckboxValidator(),
        },
        validateForm
      ),
    [validateForm]
  );

  const onValues = useCallback(
    ({ valid, values, form }) => {
      if (valid) {
        construct(
          values.useNetworkSeed ? values.networkSeed : undefined,
          values.useDiscontinuity
        );
      } else {
        unconstruct();
      }

      if (!values.useNetworkSeed && values.networkSeed) {
        form.change('networkSeed', '');
      }
    },
    [construct, unconstruct]
  );

  const initialValues = useMemo(
    () => ({
      useNetworkSeed: false,
      useDiscontinuity: false,
    }),
    []
  );

  const goRelocate = useCallback(() => push(names.RELOCATE), [push, names]);

  const usageMessage = 'You need this to authenticate with arvo';

  const renderTitle = () => {
    if (completed) {
      return 'Networking keys are now set.';
    }

    if (broadcasting) {
      return 'Setting Network Keys...';
    }

    if (!hasKeys) {
      return 'Networking keys have not yet been set.';
    }

    return 'Networking';
  };

  return (
    <>
      <Grid>
        <Grid.Item full as={ViewHeader}>
          {renderTitle()}
        </Grid.Item>
        {completed && (
          <>
            <Grid.Item
              full
              className="mb3"
              as={DownloadKeyfileButton}
              solid
              {...keyfileBind}
            />
            <Grid.Item full className="mb3 bg-red3 white t-center p3">
              {usageMessage}
            </Grid.Item>
          </>
        )}
        <BridgeForm
          validate={validate}
          onValues={onValues}
          initialValues={initialValues}>
          {() => (
            <>
              {!completed && (
                <>
                  <Grid.Item
                    full
                    as={ToggleInput}
                    name="useNetworkSeed"
                    label="Use Custom Network Seed"
                    inverseLabel="Back to Derived Network Seed"
                    disabled={inputsLocked}
                  />
                  <Condition when="useNetworkSeed" is={true}>
                    <Grid.Item full as={NoticeBox} className="mb2">
                      When using a custom network seed, you'll need to download
                      your Arvo keyfile immediately after this transaction is
                      Bridge does not store your seed.
                    </Grid.Item>
                    <Grid.Item
                      full
                      as={HexInput}
                      name="networkSeed"
                      label="Network Seed (32 bytes)"
                      disabled={inputsLocked}
                    />
                  </Condition>
                  <Grid.Item
                    full
                    as={CheckboxInput}
                    name="useDiscontinuity"
                    label="Breach Continuity"
                    disabled={inputsLocked}
                  />

                  <Grid.Item full as={FormError} />
                </>
              )}

              <Grid.Item
                full
                as={InlineEthereumTransaction}
                {...bind}
                label={`${hasKeys ? 'Reset' : 'Set'} Networking Keys`}
                onReturn={() => pop()}
              />
            </>
          )}
        </BridgeForm>
      </Grid>
    </>
  );
}
