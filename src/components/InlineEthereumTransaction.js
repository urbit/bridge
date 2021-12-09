import React, { useMemo, useCallback, useState } from 'react';
import cn from 'classnames';
import {
  Grid,
  ToggleInput,
  ErrorText,
  Flex,
  LinkButton,
  H5,
  Button,
} from 'indigo-react';
import { toBN } from 'web3-utils';

import { useExploreTxUrls } from 'lib/explorer';
import { hexify } from 'lib/txn';
import { safeFromWei, safeToWei } from 'lib/lib';

import { composeValidator, buildCheckboxValidator } from 'form/validators';
import BridgeForm from 'form/BridgeForm';
import Condition from 'form/Condition';

import { GenerateButton, ForwardButton, RestartButton } from './Buttons';
import ProgressButton from './ProgressButton';
import NeedFundsNotice from './NeedFundsNotice';
import NoticeBox from './NoticeBox';
import FeeDropdown from './L2/Dropdowns/FeeDropdown';
import CopyButton from './copiable/CopyButton';

import './InlineEthereumTransaction.scss';
import { useRollerStore } from 'store/rollerStore';

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
  const { ethBalance } = useRollerStore();
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

  const insufficientEth = useMemo(
    () => Number(maxCost) > Number(ethBalance.toString()),
    [maxCost, ethBalance]
  );

  const renderPrimarySection = () => {
    if (error) {
      return (
        <Grid.Item
          className="eth-tx-button"
          full
          as={RestartButton}
          solid
          center
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
            center
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
    } else if (insufficientEth) {
      return (
        <Grid.Item
          className="ph4 eth-tx-button insufficient-eth"
          full
          as={Button}
          solid
          center
          disabled>
          Insufficient ETH
        </Grid.Item>
      );
    } else if (showBroadcastButton) {
      return (
        <Grid.Item
          className="ph4 eth-tx-button"
          full
          as={ForwardButton}
          solid
          success
          center
          disabled={!canBroadcast}
          onClick={() => broadcast()}>
          Send Transaction
        </Grid.Item>
      );
    } else if (showLoadingButton) {
      return (
        <Grid.Item
          className="ph4 eth-tx-button"
          full
          as={ProgressButton}
          center
          success
          disabled
          progress={confirmationProgress}>
          Sending Transaction
        </Grid.Item>
      );
    } else {
      return (
        <Grid.Item
          className="ph4 eth-tx-button"
          full
          as={GenerateButton}
          center
          onClick={generateAndSign}
          disabled={!canSign}
          loading={!canSign && initializing}>
          {label}
        </Grid.Item>
      );
    }
  };

  return (
    <Grid className={cn(className, 'mt1', 'inline-ethereum-tx')}>
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
              <Grid.Item full as={ErrorText} className="mv1">
                {error.message}
              </Grid.Item>
            )}

            {needFunds && (
              <Grid.Item
                full
                as={NeedFundsNotice}
                className="mt3"
                {...needFunds}
              />
            )}

            {showSignedTx && fakeSigned && (
              <>
                <Grid.Item full as={NoticeBox} className="mt2">
                  Your wallet will sign the transaction upon sending it.
                </Grid.Item>
              </>
            )}

            {showSignedTx && !fakeSigned && (
              <>
                <Grid.Item
                  className="eth-tx-button text"
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
      <Grid.Item full as={Flex} justify="between" className="pv4 black f5">
        <Flex.Item>Nonce</Flex.Item>
        <Flex.Item>{nonce + i}</Flex.Item>
      </Grid.Item>
      <Grid.Divider />
      <Grid.Item full as={Flex} justify="between" className="pv4 black f5">
        <Flex.Item>Transaction Cost</Flex.Item>
        <Flex.Item>{maxCost} ETH</Flex.Item>
      </Grid.Item>
      <Grid.Divider />
      <Grid.Item full as={Flex} justify="between" className="mt3 mb2">
        <Flex.Item as={H5}>Signed Transaction Hex</Flex.Item>
        <Flex.Item as={CopyButton} text={serializedTxHex} />
      </Grid.Item>
      <Grid.Item full as="code" className="mb4 f6 mono gray4 wrap">
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
