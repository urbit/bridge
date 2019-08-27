import React, { useMemo, useCallback } from 'react';
import cn from 'classnames';
import {
  Grid,
  ToggleInput,
  ErrorText,
  Flex,
  LinkButton,
  H5,
  Text,
} from 'indigo-react';
import { fromWei } from 'web3-utils';

import { useExploreTxUrl } from 'lib/explorer';
import { hexify } from 'lib/txn';

import { composeValidator, buildCheckboxValidator } from 'form/validators';
import BridgeForm from 'form/BridgeForm';
import Condition from 'form/Condition';

import { GenerateButton, ForwardButton, RestartButton } from './Buttons';
import WarningBox from './WarningBox';
import CopyButton from './CopyButton';
import ProgressButton from './ProgressButton';
import CopiableAddress from './CopiableAddress';
import convertToInt from 'lib/convertToInt';

export default function InlineEthereumTransaction({
  // from useEthereumTransaction.bind
  initializing,
  canSign,
  generateAndSign,
  signed,
  broadcast,
  broadcasted,
  confirmed,
  completed,
  reset,
  error,
  gasPrice,
  setGasPrice,
  resetGasPrice,
  txHash,
  nonce,
  chainId,
  needFunds,
  signedTransaction,
  confirmationProgress,

  // additional from parent
  label = 'Generate & Sign Transaction',
  className,
  onReturn,
}) {
  // show receipt after successful broadcast
  const showReceipt = broadcasted || confirmed || completed;
  // show configure controls pre-broadcast
  const showConfigureInput = !(signed || broadcasted || confirmed || completed);
  // show the send/loading button while signed, broadcasting, or confirme
  const showBroadcastButton = signed;
  const showLoadingButton = broadcasted || confirmed;
  const canBroadcast = signed && !needFunds;
  // show signed tx only when signing (for offline usage)
  const showSignedTx = signed;

  const exploreTxUrl = useExploreTxUrl(txHash);

  const validate = useMemo(
    () =>
      composeValidator({
        useAdvanced: buildCheckboxValidator(),
        viewSigned: buildCheckboxValidator(),
      }),
    []
  );

  const onValues = useCallback(
    ({ valid, values, form }) => {
      if (!values.useAdvanced) {
        resetGasPrice();
      }
    },
    [resetGasPrice]
  );

  const renderPrimarySection = () => {
    if (error) {
      return (
        <Grid.Item full as={RestartButton} solid onClick={() => reset()}>
          Reset Transaction
        </Grid.Item>
      );
    } else if (completed) {
      return (
        <Grid.Item full className="pv4 black f5">
          Transaction Complete
        </Grid.Item>
      );
    } else if (showBroadcastButton) {
      return (
        <Grid.Item
          full
          as={ForwardButton}
          solid
          success
          disabled={!canBroadcast}
          onClick={() => broadcast()}>
          Send Transaction
        </Grid.Item>
      );
    } else if (showLoadingButton) {
      return (
        <Grid.Item
          full
          as={ProgressButton}
          success
          disabled
          progress={confirmationProgress}>
          Sending Transaction
        </Grid.Item>
      );
    } else {
      return (
        <Grid.Item
          full
          as={GenerateButton}
          onClick={generateAndSign}
          disabled={!canSign}
          loading={!canSign && initializing}>
          {label}
        </Grid.Item>
      );
    }
  };

  const serializedTxHex = useMemo(
    () => signedTransaction && hexify(signedTransaction.serialize()),
    [signedTransaction]
  );

  return (
    <Grid className={cn(className, 'mt1')}>
      <BridgeForm validate={validate} onValues={onValues}>
        {() => (
          <>
            {renderPrimarySection()}

            {error && (
              <Grid.Item full as={ErrorText} className="mv1">
                {error.message}
              </Grid.Item>
            )}

            {needFunds && (
              <Grid.Item full as={WarningBox} className="mt3">
                The address{' '}
                <CopiableAddress>{needFunds.address}</CopiableAddress> needs at
                least {fromWei(needFunds.minBalance)} ETH and currently has{' '}
                {fromWei(needFunds.balance)} ETH. Waiting until the account has
                enough funds.
              </Grid.Item>
            )}

            {showConfigureInput && (
              <>
                <Grid.Item
                  full
                  as={ToggleInput}
                  name="useAdvanced"
                  label="Advanced"
                  inverseLabel="Back to Defaults"
                  inverseColor="red3"
                  disabled={!showConfigureInput || initializing}
                />

                <Condition when="useAdvanced" is={true}>
                  <Grid.Divider />
                  <Grid.Item
                    full
                    as={Flex}
                    row
                    justify="between"
                    className="mt2">
                    <Flex.Item as={H5}>Gas Price</Flex.Item>
                    <Flex.Item as={H5}>{gasPrice} Gwei</Flex.Item>
                  </Grid.Item>
                  {/* TODO(shrugs): move to indigo/RangeInput */}
                  <Grid.Item
                    full
                    as="input"
                    type="range"
                    min="1"
                    max="100"
                    value={gasPrice}
                    onChange={e =>
                      setGasPrice(convertToInt(e.target.value, 10))
                    }
                  />
                  <Grid.Item
                    full
                    as={Flex}
                    row
                    justify="between"
                    className="f6 mt1">
                    <Flex.Item as={Text}>Cheap</Flex.Item>
                    <Flex.Item as={Text}>Fast</Flex.Item>
                  </Grid.Item>
                  <Grid.Divider className="mt4" />
                </Condition>
              </>
            )}

            {showSignedTx && (
              <>
                <Grid.Item
                  full
                  as={ToggleInput}
                  name="viewSigned"
                  label="Signed Transaction"
                  inverseLabel="Hide"
                  disabled={!showSignedTx}
                />
                <Condition when="viewSigned" is={true}>
                  <Grid.Divider />
                  <Grid.Item
                    full
                    as={Flex}
                    justify="between"
                    className="pv4 black f5">
                    <Flex.Item>Nonce</Flex.Item>
                    <Flex.Item>{nonce}</Flex.Item>
                  </Grid.Item>
                  <Grid.Divider />
                  <Grid.Item
                    full
                    as={Flex}
                    justify="between"
                    className="pv4 black f5">
                    <Flex.Item>Gas Price</Flex.Item>
                    <Flex.Item>{gasPrice.toFixed()} Gwei</Flex.Item>
                  </Grid.Item>
                  <Grid.Divider />
                  <Grid.Item
                    full
                    as={Flex}
                    justify="between"
                    className="mt3 mb2">
                    <Flex.Item as={H5}>Signed Transaction Hex</Flex.Item>
                    <Flex.Item as={CopyButton} text={serializedTxHex} />
                  </Grid.Item>
                  <Grid.Item full as="code" className="mb4 f6 mono gray4 wrap">
                    {serializedTxHex}
                  </Grid.Item>
                  <Grid.Divider />
                </Condition>
              </>
            )}

            {showReceipt && (
              <>
                <Grid.Divider />
                <Grid.Item full as={Flex} col className="pv4">
                  <Flex.Item as={Flex} row justify="between">
                    <Flex.Item as={H5}>Transaction Hash</Flex.Item>
                    <Flex.Item as={LinkButton} href={exploreTxUrl}>
                      Etherscan↗
                    </Flex.Item>
                  </Flex.Item>
                  <Flex.Item as={Flex}>
                    <Flex.Item flex as="code" className="f6 mono gray4 wrap">
                      {txHash}
                    </Flex.Item>
                    <Flex.Item flex />
                  </Flex.Item>
                </Grid.Item>
                <Grid.Divider />
              </>
            )}

            {completed && (
              <>
                <Grid.Item full as={RestartButton} onClick={onReturn}>
                  Return
                </Grid.Item>
                <Grid.Divider />
              </>
            )}
          </>
        )}
      </BridgeForm>
    </Grid>
  );
}
