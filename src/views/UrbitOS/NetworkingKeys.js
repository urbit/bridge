import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Just } from 'folktale/maybe';
import { Grid, ToggleInput, CheckboxInput, Button } from 'indigo-react';
import * as azimuth from 'azimuth-js';
import { randomHex } from 'web3-utils';

import { usePointCursor } from 'store/pointCursor';
import { usePointCache } from 'store/pointCache';
import { useNetwork } from 'store/network';
import { useWallet } from 'store/wallet';
import { useRollerStore } from 'store/rollerStore';

import useRoller from 'lib/useRoller';
import { useLocalRouter } from 'lib/LocalRouter';
import * as need from 'lib/need';
import {
  attemptNetworkSeedDerivation,
  deriveNetworkKeys,
  CRYPTO_SUITE_VERSION,
} from 'lib/keys';
import useEthereumTransaction from 'lib/useEthereumTransaction';
import { GAS_LIMITS } from 'lib/constants';
import { addHexPrefix } from 'lib/utils/address';
import useKeyfileGenerator from 'lib/useKeyfileGenerator';

import DownloadKeyfileButton from 'components/DownloadKeyfileButton';
import InlineEthereumTransaction from 'components/InlineEthereumTransaction';
import NoticeBox from 'components/NoticeBox';
import AlertBox from 'components/AlertBox';

import { HexInput } from 'form/Inputs';
import {
  composeValidator,
  buildCheckboxValidator,
  buildHexValidator,
} from 'form/validators';
import BridgeForm from 'form/BridgeForm';
import Condition from 'form/Condition';
import FormError from 'form/FormError';
import { convertToInt } from 'lib/convertToInt';
import Window from 'components/L2/Window/Window';
import HeaderPane from 'components/L2/Window/HeaderPane';
import BodyPane from 'components/L2/Window/BodyPane';
import { Box, Row } from '@tlon/indigo-react';

function useSetKeys(manualNetworkSeed, setManualNetworkSeed) {
  const { urbitWallet, wallet, authMnemonic, authToken } = useWallet();
  const { pointCursor } = usePointCursor();
  const { syncDetails, syncRekeyDate, getDetails } = usePointCache();
  const { contracts } = useNetwork();

  const _point = need.point(pointCursor);
  const _contracts = need.contracts(contracts);
  const _details = need.details(getDetails(_point));

  const networkRevision = convertToInt(_details.keyRevisionNumber, 10);
  const randomSeed = useRef();

  const {
    available: keyfileAvailable,
    generating: keyfileGenerating,
    filename,
    bind: keyfileBind,
  } = useKeyfileGenerator(manualNetworkSeed);

  const buildNetworkSeed = useCallback(
    async manualSeed => {
      if (manualSeed !== undefined) {
        setManualNetworkSeed(manualSeed);
        return manualSeed;
      } else {
        const newNetworkRevision = networkRevision + 1;
        console.log(`deriving seed with revision ${newNetworkRevision}`);

        const networkSeed = await attemptNetworkSeedDerivation({
          urbitWallet,
          wallet,
          authMnemonic,
          details: _details,
          point: _point,
          authToken,
          revision: newNetworkRevision,
        });

        if (Just.hasInstance(networkSeed)) {
          return networkSeed.value;
        }

        randomSeed.current = randomSeed.current || randomHex(32); // 32 bytes
        setManualNetworkSeed(randomSeed.current);

        return randomSeed.current;
      }
    },
    [
      _details,
      authMnemonic,
      setManualNetworkSeed,
      networkRevision,
      urbitWallet,
      wallet,
      _point,
      authToken,
    ]
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
  const completed = _completed && keyfileAvailable && !keyfileGenerating;

  return {
    completed,
    filename,
    keyfileBind,
    ...rest,
  };
}

export default function UrbitOSNetworkingKeys({
  manualNetworkSeed,
  setManualNetworkSeed,
}) {
  const { pop } = useLocalRouter();
  const { point, setLoading } = useRollerStore();
  const {
    configureNetworkingKeys,
    getPendingTransactions,
    checkForUpdates,
  } = useRoller();
  const [breach, setBreach] = useState(false);

  const hasKeys = point.networkKeysSet;

  const {
    construct,
    unconstruct,
    completed,
    inputsLocked,
    bind,
    keyfileBind,
  } = useSetKeys(manualNetworkSeed, setManualNetworkSeed);

  useEffect(() => {
    if (completed) {
      checkForUpdates(
        point.value,
        `${point.patp}'s Networking Keys have been set!`
      );
    }
  }, [completed]); // eslint-disable-line react-hooks/exhaustive-deps

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
        setBreach(values.useDiscontinuity);
        setManualNetworkSeed(values.useNetworkSeed);
      } else {
        unconstruct();
      }

      if (!values.useNetworkSeed && values.networkSeed) {
        form.change('networkSeed', '');
        setBreach(false);
        setManualNetworkSeed('');
      }
    },
    [construct, unconstruct, setManualNetworkSeed, setBreach]
  );

  const setNetworkingKeys = useCallback(async () => {
    setLoading(true);
    try {
      await configureNetworkingKeys({
        breach,
        manualNetworkSeed,
      });
      // TODO: just use the tx hash instead?
      getPendingTransactions(point);
      // TODO: this is just so we get visual feedback that the tx has gone through
      // but this should be addressed with the new UI flow (-> download keyfile)
      //
      // A question here is how to deal with the modals/messages about the keys not being
      // set since they are in pending in the Roller...
      // we could inspect if there's a changeKeys in the local list of pending txs,...
      //
      checkForUpdates(
        point.value,
        `${point.patp}'s Networking Keys have been set!`
      );
      pop();
    } catch (error) {
      // setError(error);
    } finally {
      setLoading(false);
    }
  }, [
    breach,
    manualNetworkSeed,
    getPendingTransactions,
    point,
    pop,
    configureNetworkingKeys,
    setLoading,
    checkForUpdates,
  ]);

  const initialValues = useMemo(
    () => ({
      useNetworkSeed: false,
      useDiscontinuity: false,
    }),
    []
  );

  const viewTitle = completed
    ? 'Network Keys are now set'
    : 'Set Networking Keys';

  const usageMessage =
    'You need this keyfile to authenticate with your OS. Please Download.';

  return (
    <Window>
      <HeaderPane>
        <Row className="header-row">
          <h5>{viewTitle}</h5>
        </Row>
      </HeaderPane>
      <BodyPane>
        {!completed && (
          <Grid.Item className="gray4 f5 mv2 align-self-start" full>
            Network Keys authenticate Urbit ID with Urbit OS.
          </Grid.Item>
        )}
        {completed && (
          <>
            <Grid.Item
              full
              className="mb3"
              as={DownloadKeyfileButton}
              solid
              left
              {...keyfileBind}
            />
            <Grid.Item full as={AlertBox} className="mb8">
              {usageMessage}
            </Grid.Item>
          </>
        )}
        <BridgeForm
          validate={validate}
          onValues={onValues}
          initialValues={initialValues}>
          {() => (
            <Box width="100%">
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
                      your Arvo keyfile immediately after this transaction as
                      Bridge does not store your seed.
                    </Grid.Item>
                    <Grid.Item
                      full
                      as={HexInput}
                      name="networkSeed"
                      label="Network Seed (32 bytes)"
                      disabled={inputsLocked}
                      className="mb6"
                    />
                  </Condition>
                  <Grid.Item
                    full
                    as={CheckboxInput}
                    name="useDiscontinuity"
                    label="Breach Continuity"
                    disabled={inputsLocked}
                    className="mb6"
                  />

                  <Grid.Item full as={FormError} />
                </>
              )}

              {point.isL2 ? (
                <Grid.Item
                  as={Button}
                  full
                  className=""
                  center
                  solid
                  onClick={setNetworkingKeys}>
                  {'Reset Networking Keys'}
                </Grid.Item>
              ) : (
                <Grid.Item
                  full
                  as={InlineEthereumTransaction}
                  {...bind}
                  label={`${hasKeys ? 'Reset' : 'Set'} Networking Keys`}
                  onReturn={pop}
                />
              )}
            </Box>
          )}
        </BridgeForm>
      </BodyPane>
    </Window>
  );
}
