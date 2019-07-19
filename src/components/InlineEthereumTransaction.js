import React, { useEffect } from 'react';
import cn from 'classnames';
import {
  Grid,
  ToggleInput,
  ErrorText,
  Flex,
  LinkButton,
  H5,
  Text,
  HelpText,
} from 'indigo-react';
import { fromWei } from 'web3-utils';

import { useCheckboxInput } from 'lib/useInputs';
import { useExploreTxUrl } from 'lib/explorer';
import { hexify } from 'lib/txn';

import { GenerateButton, ForwardButton, RestartButton } from './Buttons';
import WarningBox from './WarningBox';

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
  const showBroadcastButton = signed || broadcasted || confirmed;
  const canBroadcast = signed;
  const isLoading = broadcasted || confirmed;
  // show signed tx only when signing (for offline usage)
  const showSignedTx = signed;

  const exploreTxUrl = useExploreTxUrl(txHash);
  const [advancedInput, { data: advancedOpen }] = useCheckboxInput({
    name: 'advanced',
    label: 'Advanced Configuration',
    inverseLabel: 'Cancel Advanced Configuration',
    disabled: !showConfigureInput,
  });

  const [
    viewSignedTransaction,
    { data: signedTransactionOpen },
  ] = useCheckboxInput({
    name: 'viewsigned',
    label: 'View Signed Transaction',
    inverseLabel: 'Hide Signed Transaction',
    disabled: !showSignedTx,
  });

  // reset gas price when closing advanced configuration
  useEffect(() => {
    if (!advancedOpen) {
      resetGasPrice();
    }
  }, [advancedOpen, resetGasPrice]);

  const renderPrimaryButton = () => {
    if (error) {
      return (
        <Grid.Item full as={RestartButton} solid onClick={() => reset()}>
          Reset Transaction
        </Grid.Item>
      );
    } else if (completed) {
      return (
        <>
          <Grid.Divider />
          <Grid.Item full as={RestartButton} onClick={onReturn}>
            Return
          </Grid.Item>
        </>
      );
    } else if (showBroadcastButton) {
      return (
        <Grid.Item
          full
          as={ForwardButton}
          solid
          success
          disabled={!canBroadcast}
          loading={isLoading}
          onClick={() => broadcast()}>
          Send Transaction
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

  return (
    <Grid className={cn(className, 'mt1')}>
      {renderPrimaryButton()}

      {error && (
        <Grid.Item full as={ErrorText} className="mt1">
          {error.message}
        </Grid.Item>
      )}

      {needFunds && (
        <Grid.Item full as={WarningBox} className="mt3">
          The address {needFunds.address} needs at least{' '}
          {fromWei(needFunds.minBalance)} ETH and currently has{' '}
          {fromWei(needFunds.balance)} ETH. Waiting until the account has enough
          funds.
        </Grid.Item>
      )}

      {showConfigureInput && (
        <>
          <Grid.Item full as={ToggleInput} {...advancedInput} />
          {advancedOpen && (
            <>
              <Grid.Item full as={Flex} row justify="between" className="mt2">
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
                onChange={e => setGasPrice(parseInt(e.target.value, 10))}
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
              <Grid.Item full as={HelpText} className="mt3">
                Nonce: {nonce}
              </Grid.Item>
              <Grid.Item full as={HelpText} className="mt1">
                Chain ID: {chainId}
              </Grid.Item>
              <Grid.Divider className="mt3" />
            </>
          )}
        </>
      )}

      {showSignedTx && (
        <>
          <Grid.Item full as={ToggleInput} {...viewSignedTransaction} />
          {signedTransactionOpen && (
            <Grid.Item full as="code" className="f6 mono gray4 wrap">
              {hexify(signedTransaction.serialize())}
            </Grid.Item>
          )}
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
    </Grid>
  );
}
