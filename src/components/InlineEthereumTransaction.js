import React from 'react';
import cn from 'classnames';
import {
  Grid,
  ToggleInput,
  ErrorText,
  Flex,
  LinkButton,
  H5,
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
  setGasPrice,
  txHash,
  signedTransaction,

  // additional from parent
  className,
  onReturn,
}) {
  const exploreHashUrl = useExploreTxUrl(txHash);
  const [configureInput, { data: configurationOpen }] = useCheckboxInput({
    name: 'configure',
    label: 'Configure Transaction',
    inverseLabel: 'Cancel Configure Transaction',
    disabled: signed || broadcasted || confirmed,
  });

  const [
    viewSignedTransaction,
    { data: signedTransactionOpen },
  ] = useCheckboxInput({
    name: 'viewsigned',
    label: 'View Signed Transaction',
    inverseLabel: 'Hide Signed Transaction',
    disabled: !signed,
  });

  // show receipt after successful broadcast
  const showReceipt = broadcasted || confirmed;
  // show configure controls pre-broadcast
  const showConfigureInput = !(broadcasted || confirmed);
  // show signed tx after signing
  const showSignedTx = signed;

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
        <Grid.Item full as={ToggleInput} {...configureInput} />
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
