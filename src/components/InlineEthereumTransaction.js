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
import CopyButton from './CopyButton';
import ProgressButton from './ProgressButton';
import convertToInt from 'lib/convertToInt';
import NeedFundsNotice from './NeedFundsNotice';

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
  txHashes,
  nonce,
  chainId,
  needFunds,
  signedTransactions,
  confirmationProgress,
  gasLimit,
  unsignedTransactions,

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
        <Grid.Item full as={RestartButton} solid onClick={() => reset()}>
          Reset Transaction
        </Grid.Item>
      );
    } else if (completed) {
      return undefined;
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
        )
      ),
    [gasLimit, gasPrice, numTxs]
  );

  const gasInfo = useMemo(() => {
    const extra = numTxs === 1 ? '' : `*  ${numTxs} TXN`;
    return showGasDetails
      ? `${gasPrice} Gwei * ${gasLimit} ${extra} = ${maxCost} ETH`
      : `${maxCost} ETH`;
  }, [showGasDetails, maxCost, gasPrice, gasLimit, numTxs]);

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
              <Grid.Item
                full
                as={NeedFundsNotice}
                className="mt3"
                {...needFunds}
              />
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
                  <Grid.Item full className="mb2"></Grid.Item>
                  <Grid.Divider />
                  <Grid.Item
                    full
                    as={Flex}
                    row
                    justify="between"
                    className="mt2">
                    <Flex.Item as={H5}>Gas Price</Flex.Item>

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
                  <SignedTransactionList
                    serializedTxsHex={serializedTxsHex}
                    gasPrice={gasPrice}
                    nonce={nonce}
                  />
                </Condition>
              </>
            )}

            {completed && (
              <>
                <Grid.Divider />
                <Grid.Item full as={RestartButton} onClick={onReturn}>
                  Return
                </Grid.Item>
                <Grid.Divider />
                {showReceipt && (
                  <TransactionReceipt
                    txHashes={txHashes}
                    maxCost={maxCost}
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
            )}
          </>
        )}
      </BridgeForm>
    </Grid>
  );
}

function SignedTransactionList({ serializedTxsHex, nonce, gasPrice }) {
  return serializedTxsHex.map((serializedTxHex, i) => (
    <React.Fragment key="i">
      <Grid.Divider />
      <Grid.Item full as={Flex} justify="between" className="pv4 black f5">
        <Flex.Item>Nonce</Flex.Item>
        <Flex.Item>{nonce + i}</Flex.Item>
      </Grid.Item>
      <Grid.Divider />
      <Grid.Item full as={Flex} justify="between" className="pv4 black f5">
        <Flex.Item>Gas Price</Flex.Item>
        <Flex.Item>{gasPrice.toFixed()} Gwei</Flex.Item>
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

function TransactionReceipt({ txHashes, maxCost, onClose }) {
  const txUrls = useExploreTxUrls(txHashes);
  return (
    <>
      <Grid.Item full as={Flex} justify="between" className="pv2 black f5">
        <Flex.Item>Receipt</Flex.Item>
        <Flex.Item onClick={onClose} className="underline pointer">
          Close
        </Flex.Item>
      </Grid.Item>
      <Grid.Item full as={Flex} justify="between" className="pv2 black f5">
        <Flex.Item>Gas Price</Flex.Item>
        <Flex.Item className="mono">{maxCost} ETH</Flex.Item>
      </Grid.Item>
      <Grid.Divider />
      <Grid.Item full as={Flex} col className="pv4">
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
