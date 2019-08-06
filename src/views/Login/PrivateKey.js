import React, { useCallback, useMemo } from 'react';
import { Just, Nothing } from 'folktale/maybe';
import { Grid } from 'indigo-react';

import { useWallet } from 'store/wallet';

import { EthereumWallet, WALLET_TYPES, stripHexPrefix } from 'lib/wallet';
import useLoginView from 'lib/useLoginView';

import FormError from 'form/FormError';
import BridgeForm from 'form/BridgeForm';
import { HexInput } from 'form/Inputs';
import { buildHexValidator, composeValidator } from 'form/validators';

import ContinueButton from './ContinueButton';

export default function PrivateKey({ className, goHome }) {
  useLoginView(WALLET_TYPES.PRIVATE_KEY);

  const { setWallet } = useWallet();

  const validate = useMemo(
    () =>
      composeValidator({
        privatekey: buildHexValidator(64),
      }),
    []
  );

  const onValues = useCallback(
    ({ valid, values }) => {
      if (valid) {
        const sec = Buffer.from(stripHexPrefix(values.privatekey), 'hex');
        const newWallet = new EthereumWallet(sec);
        setWallet(Just(newWallet));
      } else {
        setWallet(Nothing());
      }
    },
    [setWallet]
  );

  return (
    <Grid className={className}>
      <BridgeForm validate={validate} onValues={onValues} afterSubmit={goHome}>
        {({ handleSubmit }) => (
          <>
            <Grid.Item
              full
              as={HexInput}
              name="privatekey"
              label="Private key"
            />
            <Grid.Item full as={FormError} />
            <Grid.Item full as={ContinueButton} handleSubmit={handleSubmit} />
          </>
        )}
      </BridgeForm>
    </Grid>
  );
}
