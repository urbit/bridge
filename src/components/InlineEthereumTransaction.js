import React from 'react';
import { Grid, ToggleInput, ErrorText } from 'indigo-react';
import { GenerateButton, ForwardButton } from './Buttons';
import { useCheckboxInput } from 'lib/useInputs';
import Blinky from './Blinky';

export default function InlineEthereumTransaction({
  initializing,
  construct,
  constructed,
  canSign,
  generateAndSign,
  signed,
  broadcast,
  broadcasted,
  confirmed,
  reset,
  error,
  setGasPrice,
  className,
}) {
  const [configureInput, { data: configurationOpen }] = useCheckboxInput({
    name: 'configure',
    label: 'Configure Transaction',
    disabled: signed || broadcasted || confirmed,
  });

  const [
    viewSignedTransaction,
    { data: signedTransactionOpen },
  ] = useCheckboxInput({
    name: 'viewsigned',
    label: 'View Signed Transaction',
    disabled: !signed,
  });

  const renderButton = () => {
    if (confirmed) {
      // some sort of next button or nothing at all
      return null;
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
    <Grid className={className}>
      {renderButton()}

      {error && (
        <Grid.Item full as={ErrorText} className="mt1">
          {error.message}
        </Grid.Item>
      )}
      <Grid.Item full as={ToggleInput} {...configureInput} />

      {!broadcasted && !confirmed && (
        <Grid.Item full as={ToggleInput} {...viewSignedTransaction} />
      )}
    </Grid>
  );
}
