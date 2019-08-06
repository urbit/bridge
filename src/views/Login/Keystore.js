import React, { useCallback, useMemo } from 'react';
import { Just } from 'folktale/maybe';
import { P, Grid } from 'indigo-react';
import * as keythereum from 'keythereum';

import { useWallet } from 'store/wallet';

import { EthereumWallet, WALLET_TYPES } from 'lib/wallet';
import useLoginView from 'lib/useLoginView';

import { PassphraseInput } from 'form/Inputs';
import {
  composeValidator,
  buildPassphraseValidator,
  buildUploadValidator,
} from 'form/validators';
import UploadInput from 'form/UploadInput';
import ContinueButton from './ContinueButton';
import BridgeForm from 'form/BridgeForm';
import { FORM_ERROR } from 'final-form';
import FormError from 'form/FormError';

export default function Keystore({ className, goHome }) {
  useLoginView(WALLET_TYPES.KEYSTORE);

  // globals
  const { setWallet } = useWallet();

  const validate = useMemo(
    () =>
      composeValidator({
        passphrase: buildPassphraseValidator(),
        keystore: buildUploadValidator(),
      }),
    []
  );

  const onSubmit = useCallback(
    async values => {
      try {
        const json = JSON.parse(values.keystore);
        const privateKey = keythereum.recover(values.passphrase, json);

        const wallet = new EthereumWallet(privateKey);
        setWallet(Just(wallet));
      } catch (error) {
        console.error(error);
        return {
          [FORM_ERROR]:
            "Couldn't decrypt wallet. You may have entered an incorrect password.",
        };
      }
    },
    [setWallet]
  );

  return (
    <Grid className={className}>
      <Grid.Item full as={P}>
        Please upload your Ethereum keystore file. If your keystore file is
        encrypted with a password, you'll also need to enter that below.
      </Grid.Item>

      <BridgeForm validate={validate} onSubmit={onSubmit} afterSubmit={goHome}>
        {({ handleSubmit }) => (
          <>
            <Grid.Item
              full
              as={UploadInput}
              name="keystore"
              label="Upload Keystore file"
            />

            <Grid.Item
              full
              as={PassphraseInput}
              className="mt3"
              name="passphrase"
              label="Passphrase"
            />

            <Grid.Item full as={FormError} />

            <Grid.Item full as={ContinueButton} handleSubmit={handleSubmit}>
              Decrypt
            </Grid.Item>
          </>
        )}
      </BridgeForm>
    </Grid>
  );
}
