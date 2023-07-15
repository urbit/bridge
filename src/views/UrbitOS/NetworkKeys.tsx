import { useCallback, useEffect, useMemo, useState } from 'react';
import { Grid, Button } from 'indigo-react';
import { Box, Checkbox, Icon, Row, Text } from '@tlon/indigo-react';

import { useRollerStore } from 'store/rollerStore';

import useRoller from 'lib/useRoller';
import { useLocalRouter } from 'lib/LocalRouter';
import { ONE_SECOND } from 'lib/constants';

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
import FormError from 'form/FormError';
import Window from 'components/L2/Window/Window';
import HeaderPane from 'components/L2/Window/HeaderPane';
import BodyPane from 'components/L2/Window/BodyPane';

import './NetworkKeys.scss';
import { L1TxnType } from 'lib/types/PendingL1Transaction';
import { PointField } from 'lib/types/Point';
import { useSetNetworkKeys } from 'lib/usetSetNetworkKeys';

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
  const [useCustomSeed, setUseCustomSeed] = useState(false);
  const [l2Completed, setL2Completed] = useState(false);

  const hasKeys = point.networkKeysSet;

  const {
    construct,
    unconstruct,
    completed,
    inputsLocked,
    bind,
    keyfileBind,
    txHashes,
  } = useSetNetworkKeys(manualNetworkSeed, setManualNetworkSeed);

  useEffect(() => {
    if (completed) {
      checkForUpdates({
        point: point,
        field: PointField.keyRevisionNumber,
        message: `${point.patp}'s Network Keys have been set!`,
        l1Txn: {
          id: `${point.keyRevisionNumber}-network-keys-${point.value}`,
          point: point.value,
          type: L1TxnType.setNetworkKeys,
          hash: txHashes[0],
          time: new Date().getTime(),
        },
        intervalTime: ONE_SECOND,
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
        construct(networkSeed, false);
        setManualNetworkSeed(networkSeed);
      } else {
        unconstruct();
      }

      if (!useCustomSeed && values.networkSeed) {
        form.change('networkSeed', '');
        setManualNetworkSeed('');
      }
    },
    [construct, unconstruct, setManualNetworkSeed, useCustomSeed]
  );

  const setNetworkKeys = useCallback(async () => {
    setLoading(true);
    try {
      await configureNetworkKeys({
        breach: false,
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
        point: point,
        message: `${point.patp}'s Network Keys have been set!`,
        intervalTime: ONE_SECOND,
      });
      setTimeout(() => setL2Completed(true), ONE_SECOND);
    } catch (error) {
      // setError(error);
    } finally {
      setLoading(false);
    }
  }, [
    manualNetworkSeed,
    getPendingTransactions,
    point,
    configureNetworkKeys,
    setLoading,
    checkForUpdates,
  ]);

  const initialValues = useMemo(() => ({}), []);

  const viewTitle = completed
    ? 'Network Keys have been set'
    : hasKeys
    ? 'Set Network Keys'
    : 'Initiate Network Keys';

  const resetMessage = () => (
    <>
      <Text as="p" textAlign={'center'}>
        Copy the contents of the Network Key file and run
      </Text>
      <Text
        as="code"
        mono
        bg={'washedGray'}
        padding={2}
        borderRadius={2}
        textAlign={'center'}>
        |rekey 'keyfile_contents'
      </Text>
      <Text as="p" textAlign={'center'}>
        using the dojo on your running ship.
      </Text>
    </>
  );

  const buttonText = `${hasKeys ? 'Reset' : 'Set'} Network Keys`;

  const isComplete = completed || l2Completed;

  return (
    <Window className="network-keys">
      <HeaderPane>
        <h5>{viewTitle}</h5>
      </HeaderPane>
      <BodyPane>
        {isComplete && (
          <Box className="flex-col col justify-between h-full">
            <Box className="flex-col h-full justify-center">
              <Icon icon="Download" className="download" />
              {resetMessage()}
            </Box>
            {point.isL2 ? (
              <Grid.Item
                full
                as={Button}
                solid
                center
                onClick={keyfileBind.download}>
                Download Network Key
              </Grid.Item>
            ) : (
              <Grid.Item
                full
                as={DownloadKeyfileButton}
                solid
                center
                {...keyfileBind}
              />
            )}
          </Box>
        )}

        {!isComplete && (
          <BridgeForm
            validate={validate}
            onValues={onValues}
            initialValues={initialValues}>
            {() => (
              <Box className="contents">
                {!isComplete && (
                  <Box>
                    <Row
                      className="check-row"
                      onClick={() => setUseCustomSeed(!useCustomSeed)}>
                      <Checkbox
                        className="checkbox"
                        selected={useCustomSeed}
                        disabled={inputsLocked}
                      />
                      Use Custom Network Seed (optional)
                    </Row>
                    <Box className="info-text">
                      Enter your own network seed from which to derive the keys
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
                    {buttonText}
                  </Grid.Item>
                ) : (
                  <Grid.Item
                    full
                    as={InlineEthereumTransaction}
                    {...bind}
                    label={buttonText}
                    onReturn={() => pop()}
                  />
                )}
              </Box>
            )}
          </BridgeForm>
        )}
      </BodyPane>
    </Window>
  );
}
