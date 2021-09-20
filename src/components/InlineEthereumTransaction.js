import React, { useMemo, useCallback, useState } from 'react';
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
import { toBN } from 'web3-utils';

import { ReactComponent as InfoIcon } from 'assets/info.svg';

import { useExploreTxUrls } from 'lib/explorer';
import { hexify } from 'lib/txn';
import { safeFromWei, safeToWei } from 'lib/lib';

import { composeValidator, buildCheckboxValidator } from 'form/validators';
import BridgeForm from 'form/BridgeForm';
import Condition from 'form/Condition';

import { GenerateButton, ForwardButton, RestartButton } from './Buttons';
import CopyButton from './copiable/CopyButton';
import ProgressButton from './ProgressButton';
import { convertToInt } from 'lib/convertToInt';
import NeedFundsNotice from './NeedFundsNotice';
import NoticeBox from './NoticeBox';

import './InlineEthereumTransaction.scss';

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
  nonce,
  chainId,
  needFunds,
  signedTransactions,
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

  const [showGasDetails, _setShowGasDetails] = useState(false);
  const toggleGasDetails = useCallback(
    () => _setShowGasDetails(!showGasDetails),
    [_setShowGasDetails, showGasDetails]
  );

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

  const serializedTxsHex = useMemo(
    () =>
      signedTransactions &&
      signedTransactions.map(stx => hexify(stx.serialize())),
    [signedTransactions]
  );

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

  const gasInfo = useMemo(() => {
    const extra = numTxs === 1 ? '' : `*  ${numTxs} txs`;
    return showGasDetails
      ? `${gasPrice} Gwei * ${gasLimit} ${extra} = ${maxCost} ETH`
      : `${maxCost} ETH`;
  }, [showGasDetails, maxCost, gasPrice, gasLimit, numTxs]);

  return (
    <Grid className={cn(className, 'mt1')}>
      <BridgeForm validate={validate} onValues={onValues}>
        {() => (
          <>
            {showConfigureInput && (
              <>
                <Grid.Item
                  className="eth-tx-button"
                  full
                  as={ToggleInput}
                  name="useAdvanced"
                  label="Advanced"
                  inverseLabel="Back to Defaults"
                  inverseColor="red3"
                  disabled={!showConfigureInput || initializing}
                />

                <Condition when="useAdvanced" is={true}>
                  <Grid.Item className="mb2 eth-tx-button" full></Grid.Item>
                  <Grid.Divider />
                  <Grid.Item
                    className="mt2 eth-tx-button"
                    full
                    as={Flex}
                    row
                    justify="between">
                    <Flex.Item as={H5}>Transaction Fee</Flex.Item>

                    <Flex.Item as={H5}>
                      {gasInfo}{' '}
                      <InfoIcon
                        className="pointer"
                        onClick={toggleGasDetails}
                      />
                    </Flex.Item>
                  </Grid.Item>

                  {/* TODO(shrugs): move to indigo/RangeInput */}
                  <Grid.Item
                    className="eth-tx-button"
                    full
                    as="input"
                    type="range"
                    min="1"
                    max="400"
                    value={gasPrice}
                    onChange={e =>
                      setGasPrice(convertToInt(e.target.value, 10))
                    }
                  />
                  <Grid.Item
                    className="f6 mt1 eth-tx-button"
                    full
                    as={Flex}
                    row
                    justify="between">
                    <Flex.Item as={Text}>Cheap</Flex.Item>
                    <Flex.Item as={Text}>Fast</Flex.Item>
                  </Grid.Item>
                  <Grid.Divider className="mt4" />
                </Condition>
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

            {showSignedTx && !fakeSigned && (
              <>
                <Grid.Item
                  className="eth-tx-button"
                  full
                  as={ToggleInput}
                  name="viewSigned"
                  label="Signed Transaction"
                  inverseLabel="Hide"
                  disabled={!showSignedTx}
                />
                <Condition when="viewSigned" is={true}>
                  <SignedTransactionList
                    serializedTxsHex={serializedTxsHex}
                    maxCost={maxCost}
                    nonce={nonce}
                  />
                </Condition>
              </>
            )}
          </>
        )}
      </BridgeForm>
    </Grid>
  );
}

function SignedTransactionList({ serializedTxsHex, nonce, maxCost }) {
  return serializedTxsHex.map((serializedTxHex, i) => (
    <React.Fragment key={i}>
      <Grid.Divider />
      <Grid.Item
        className="pv4 black f5 eth-tx-button"
        full
        as={Flex}
        justify="between">
        <Flex.Item>Nonce</Flex.Item>
        <Flex.Item>{nonce + i}</Flex.Item>
      </Grid.Item>
      <Grid.Divider />
      <Grid.Item
        className="pv4 black f5 eth-tx-button"
        full
        as={Flex}
        justify="between">
        <Flex.Item>Transaction Cost</Flex.Item>
        <Flex.Item>{maxCost} ETH</Flex.Item>
      </Grid.Item>
      <Grid.Divider />
      <Grid.Item
        className="mt3 mb2 eth-tx-button"
        full
        as={Flex}
        justify="between">
        <Flex.Item as={H5}>Signed Transaction Hex</Flex.Item>
        <Flex.Item as={CopyButton} text={serializedTxHex} />
      </Grid.Item>
      <Grid.Item
        className="mb4 f6 mono gray4 wrap eth-tx-button"
        full
        as="code">
        {serializedTxHex}
      </Grid.Item>
      <Grid.Divider />
    </React.Fragment>
  ));
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
