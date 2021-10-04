import React, { useMemo, useCallback, useState } from 'react';
import cn from 'classnames';
import { Grid, ErrorText, Flex, LinkButton, H5 } from 'indigo-react';
import { toBN } from 'web3-utils';

import { useExploreTxUrls } from 'lib/explorer';
import { safeFromWei, safeToWei } from 'lib/lib';

import { composeValidator, buildCheckboxValidator } from 'form/validators';
import BridgeForm from 'form/BridgeForm';

import { GenerateButton, ForwardButton, RestartButton } from './Buttons';
import ProgressButton from './ProgressButton';
import NeedFundsNotice from './NeedFundsNotice';
import NoticeBox from './NoticeBox';

import './InlineEthereumTransaction.scss';
import FeeDropdown from './L2/Dropdowns/FeeDropdown';

export default function InlineEthereumTransaction({
  // from useEthereumTransaction.bind
  initializing,
  canSign,
  generateAndSign,
  signed,
  fakeSigned,
  broadcast,
  broadcasted,
  confirmed,
  completed,
  reset,
  error,
  gasPrice,
  setGasPrice,
  resetGasPrice,
  txHashes,
  needFunds,
  confirmationProgress,
  gasLimit,
  unsignedTransactions,
  finalCost,

  // additional from parent
  label = 'Generate & Sign Transaction',
  className,
  onReturn,
}) {
  // show receipt after successful broadcast
  const [showReceipt, setShowReceipt] = useState(false);
  const toggleShowReceipt = useCallback(() => setShowReceipt(!showReceipt), [
    setShowReceipt,
    showReceipt,
  ]);
  // show configure controls pre-broadcast
  const showConfigureInput = !(signed || broadcasted || confirmed || completed);
  // show the send/loading button while signed, broadcasting, or confirme
  const showBroadcastButton = signed;
  const showLoadingButton = broadcasted || confirmed;
  const canBroadcast = signed && !needFunds;
  // show signed tx only when signing (for offline usage)
  const showSignedTx = signed;

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
        <Grid.Item
          className="eth-tx-button"
          full
          as={RestartButton}
          solid
          onClick={() => reset()}>
          Reset Transaction
        </Grid.Item>
      );
    } else if (completed) {
      return (
        <>
          <Grid.Divider />
          <Grid.Item
            className="eth-tx-button"
            full
            as={RestartButton}
            onClick={onReturn}>
            Return
          </Grid.Item>
          <Grid.Divider />
          {showReceipt && (
            <TransactionReceipt
              txHashes={txHashes}
              finalCost={finalCost}
              onClose={toggleShowReceipt}
            />
          )}

          {!showReceipt && (
            <Grid.Item
              className="underline mv2 pointer"
              full
              onClick={toggleShowReceipt}>
              View Receipt
            </Grid.Item>
          )}
        </>
      );
    } else if (showBroadcastButton) {
      return (
        <Grid.Item
          className="eth-tx-button"
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
          className="eth-tx-button"
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
          className="eth-tx-button"
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

  const numTxs = useMemo(() => (unsignedTransactions || []).length || 1, [
    unsignedTransactions,
  ]);
  const maxCost = useMemo(
    () =>
      safeFromWei(
        safeToWei(
          toBN(gasLimit)
            .mul(toBN(gasPrice))
            .mul(toBN(numTxs)),
          'gwei'
        ),
        'ether'
      ),
    [gasLimit, gasPrice, numTxs]
  );

  return (
    <Grid className={cn(className, 'mt1')}>
      <BridgeForm validate={validate} onValues={onValues}>
        {() => (
          <>
            {showConfigureInput && (
              <>
                <Grid.Item
                  className="mt2 text eth-tx-button"
                  full
                  as={Flex}
                  row
                  justify="between">
                  <Flex.Item as={H5}>Gas Fee</Flex.Item>
                  <FeeDropdown setGasPrice={setGasPrice} />
                </Grid.Item>

                <Grid.Item
                  className="mt2 text eth-tx-button"
                  full
                  as={Flex}
                  row
                  justify="between">
                  <Flex.Item as={H5}>Max Transaction Cost</Flex.Item>
                  <Flex.Item as={H5}>{maxCost} ETH</Flex.Item>
                </Grid.Item>
                <Grid.Divider className="mt4" />
              </>
            )}

            {renderPrimarySection()}

            {error && (
              <Grid.Item className="mv1 eth-tx-button" full as={ErrorText}>
                {error.message}
              </Grid.Item>
            )}

            {needFunds && (
              <Grid.Item
                className="mt3 eth-tx-button"
                full
                as={NeedFundsNotice}
                {...needFunds}
              />
            )}

            {showSignedTx && fakeSigned && (
              <>
                <Grid.Item className="mt2 eth-tx-button" full as={NoticeBox}>
                  Your wallet will sign the transaction upon sending it.
                </Grid.Item>
              </>
            )}
          </>
        )}
      </BridgeForm>
    </Grid>
  );
}

function TransactionReceipt({ txHashes, finalCost, onClose }) {
  const txUrls = useExploreTxUrls(txHashes);
  return (
    <>
      <Grid.Item
        className="pv2 black f5 eth-tx-button"
        full
        as={Flex}
        justify="between">
        <Flex.Item>Receipt</Flex.Item>
        <Flex.Item onClick={onClose} className="underline pointer">
          Close
        </Flex.Item>
      </Grid.Item>
      <Grid.Item
        className="pv2 black f5 eth-tx-button"
        full
        as={Flex}
        justify="between">
        <Flex.Item>Transaction Cost</Flex.Item>
        <Flex.Item className="mono">{finalCost} ETH</Flex.Item>
      </Grid.Item>
      <Grid.Divider />
      <Grid.Item className="pv4 eth-tx-button" full as={Flex} col>
        <Flex.Item as={H5}>Receipt</Flex.Item>

        {txHashes &&
          txHashes.map((txHash, i) => (
            <Flex.Item as={Flex} className="mv3">
              <>
                <Flex.Item
                  key={i}
                  flex
                  as="code"
                  className="f6 mono gray4 wrap ">
                  {txHash}
                </Flex.Item>
                <Flex.Item className="ml8" as={LinkButton} href={txUrls[i]}>
                  Etherscan↗
                </Flex.Item>
              </>
            </Flex.Item>
          ))}
      </Grid.Item>
    </>
  );
}
