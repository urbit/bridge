import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Just } from 'folktale/maybe';
import { Grid, Button } from 'indigo-react';
import * as azimuth from 'azimuth-js';
import { randomHex } from 'web3-utils';
import { Box, Checkbox, Row } from '@tlon/indigo-react';

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
import FormError from 'form/FormError';
import { convertToInt } from 'lib/convertToInt';
import Window from 'components/L2/Window/Window';
import HeaderPane from 'components/L2/Window/HeaderPane';
import BodyPane from 'components/L2/Window/BodyPane';

import './NetworkKeys.scss';
import { L1TxnType } from 'lib/types/PendingL1Transaction';

function useSetKeys(
  manualNetworkSeed: string,
  setManualNetworkSeed: (seed: string) => void
) {
  const { urbitWallet, wallet, authMnemonic, authToken }: any = useWallet();
  const { pointCursor }: any = usePointCursor();
  const { syncDetails, syncRekeyDate, getDetails }: any = usePointCache();
  const { contracts }: any = useNetwork();

  const _point = need.point(pointCursor);
  const _contracts = need.contracts(contracts);
  const _details = need.details(getDetails(_point));

  const networkRevision = convertToInt(_details.keyRevisionNumber, 10);
  const randomSeed = useRef<string | null>();

  const {
    available: keyfileAvailable,
    generating: keyfileGenerating,
    filename,
    bind: keyfileBind,
  } = useKeyfileGenerator({ seed: manualNetworkSeed });

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
      async (manualSeed: string, isDiscontinuity: boolean) => {
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

export default function UrbitOSNetworkKeys({
  manualNetworkSeed,
  setManualNetworkSeed,
}: {
  manualNetworkSeed: string;
  setManualNetworkSeed: (seed: string) => void;
}) {
  const { pop }: any = useLocalRouter();
  const { point, setLoading } = useRollerStore();
  const {
    configureNetworkKeys,
    getPendingTransactions,
    checkForUpdates,
  } = useRoller();
  const [breach, setBreach] = useState(false);
  const [useCustomSeed, setUseCustomSeed] = useState(false);

  const hasKeys = point.networkKeysSet;

  const {
    construct,
    unconstruct,
    completed,
    inputsLocked,
    bind,
    keyfileBind,
    txHashes,
  } = useSetKeys(manualNetworkSeed, setManualNetworkSeed);

  useEffect(() => {
    if (completed) {
      checkForUpdates({
        point: point.value,
        message: `${point.patp}'s Network Keys have been set!`,
        l1Txn: {
          id: `${point.keyRevisionNumber}-network-keys-${point.value}`,
          point: point.value,
          type: L1TxnType.setNetworkKeys,
          hash: txHashes[0],
          time: new Date().getTime(),
        },
      });
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
        const networkSeed = useCustomSeed ? values.networkSeed : undefined;
        construct(networkSeed, breach);
        setManualNetworkSeed(networkSeed);
      } else {
        unconstruct();
      }

      if (!useCustomSeed && values.networkSeed) {
        form.change('networkSeed', '');
        setBreach(false);
        setManualNetworkSeed('');
      }
    },
    [
      construct,
      unconstruct,
      breach,
      setManualNetworkSeed,
      setBreach,
      useCustomSeed,
    ]
  );

  const setNetworkKeys = useCallback(async () => {
    setLoading(true);
    try {
      await configureNetworkKeys({
        breach,
        customNetworkSeed: manualNetworkSeed,
      });
      // TODO: just use the tx hash instead?
      getPendingTransactions();
      // TODO: this is just so we get visual feedback that the tx has gone through
      // but this should be addressed with the new UI flow (-> download keyfile)
      //
      // A question here is how to deal with the modals/messages about the keys not being
      // set since they are in pending in the Roller...
      // we could inspect if there's a changeKeys in the local list of pending txs,...
      //
      checkForUpdates({
        point: point.value,
        message: `${point.patp}'s Network Keys have been set!`,
      });
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
    configureNetworkKeys,
    setLoading,
    checkForUpdates,
  ]);

  const initialValues = useMemo(() => ({}), []);

  const viewTitle = completed ? 'Network Keys are now set' : 'Set Network Keys';

  const usageMessage =
    'You need this keyfile to authenticate with your OS. Please Download.';

  return (
    <Window className="network-keys">
      <HeaderPane>
        <h5>{viewTitle}</h5>
      </HeaderPane>
      <BodyPane>
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
            <Box className="contents">
              {!completed && (
                <Box>
                  <Row className="check-row" onClick={() => setBreach(!breach)}>
                    <Checkbox
                      className="checkbox"
                      selected={breach}
                      disabled={inputsLocked}
                    />
                    Factory Reset
                  </Row>
                  <Box className="info-text">
                    Use if your ship is corrupted, you lost your files, or
                    <br />
                    you want to erase your data
                  </Box>
                  <Row
                    className="check-row"
                    onClick={() => setUseCustomSeed(!useCustomSeed)}>
                    <Checkbox
                      className="checkbox"
                      selected={useCustomSeed}
                      disabled={inputsLocked}
                    />
                    Custom Network Seed
                  </Row>
                  <Box className="info-text">
                    Enter your own custom network seed to derive from
                  </Box>
                  {useCustomSeed && (
                    <>
                      <Grid.Item full as={NoticeBox} className="mb2">
                        When using a custom network seed, you'll need to
                        download your Arvo keyfile immediately after this
                        transaction as Bridge does not store your seed.
                      </Grid.Item>
                      <Grid.Item
                        full
                        as={HexInput}
                        name="networkSeed"
                        label="Network Seed (32 bytes)"
                        disabled={inputsLocked}
                        className="mb5"
                      />
                    </>
                  )}
                  <Grid.Item full as={FormError} />
                </Box>
              )}

              {point.isL2 ? (
                <Grid.Item
                  as={Button}
                  full
                  className=""
                  center
                  solid
                  onClick={setNetworkKeys}>
                  {'Reset Network Keys'}
                </Grid.Item>
              ) : (
                <Grid.Item
                  full
                  as={InlineEthereumTransaction}
                  {...bind}
                  label={`${hasKeys ? 'Reset' : 'Set'} Network Keys`}
                  onReturn={() => pop()}
                />
              )}
            </Box>
          )}
        </BridgeForm>
      </BodyPane>
    </Window>
  );
}
