import React from 'react';
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
import { GenerateButton, ForwardButton, RestartButton } from './Buttons';
import { useCheckboxInput } from 'lib/useInputs';
import Blinky from './Blinky';
import { hexify } from 'lib/txn';
import { useExploreTxUrl } from 'lib/explorer';

export default function InlineEthereumTransaction({
  // from useEthereumTransaction.bind
  initializing,
  canSign,
  generateAndSign,
  signed,
  broadcast,
  broadcasted,
  confirmed,
  reset,
  error,
  gasPrice,
  setGasPrice,
  txHash,
  nonce,
  chainId,
  signedTransaction,

  // additional from parent
  className,
  onReturn,
}) {
  // show receipt after successful broadcast
  const showReceipt = broadcasted || confirmed;
  // show configure controls pre-broadcast
  const showConfigureInput = !(signed || broadcasted || confirmed);
  // show signed tx after signing
  const showSignedTx = signed;

  const exploreHashUrl = useExploreTxUrl(txHash);
  const [advancedInput, { data: advancedOpen }] = useCheckboxInput({
    name: 'advanced',
    label: 'Advanced Configuration',
    inverseLabel: 'Hide Advanced Configuration',
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

  const renderButton = () => {
    if (error) {
      return (
        <Grid.Item full as={RestartButton} solid onClick={() => reset()}>
          Reset Transaction
        </Grid.Item>
      );
    } else if (confirmed) {
      return (
        <>
          <Grid.Divider />
          <Grid.Item full as={RestartButton} onClick={onReturn}>
            Return
          </Grid.Item>
        </>
      );
    } else if (broadcasted) {
      return (
        <Grid.Item
          full
          as={ForwardButton}
          solid
          success
          disabled
          accessory={<Blinky />}>
          Sending Transaction...
        </Grid.Item>
      );
    } else if (signed) {
      return (
        <Grid.Item
          full
          as={ForwardButton}
          solid
          success
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
          accessory={!canSign && initializing ? <Blinky /> : undefined}>
          Generate & Sign Transaction
        </Grid.Item>
      );
    }
  };

  return (
    <Grid className={cn(className, 'mt1')}>
      {renderButton()}

      {error && (
        <Grid.Item full as={ErrorText} className="mt1">
          {error.message}
        </Grid.Item>
      )}

      {showConfigureInput && (
        <>
          {!advancedOpen ? (
            <Grid.Item full as={ToggleInput} {...advancedInput} />
          ) : (
            <>
              <Grid.Item full as={Flex} row justify="between" className="mt2">
                <Flex.Item as={H5}>Gas Price</Flex.Item>
                <Flex.Item as={H5}>{gasPrice} Gwei</Flex.Item>
              </Grid.Item>
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
              <Flex.Item as={LinkButton} href={exploreHashUrl}>
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
