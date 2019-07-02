import React, { useState } from 'react';
import Maybe from 'folktale/maybe';
import * as keythereum from 'keythereum';
import { P, Grid, Input, ErrorText } from 'indigo-react';

import { usePassphraseInput } from 'components/Inputs';
import { ForwardButton } from 'components/Buttons';

import { useWallet } from 'store/wallet';

import * as need from 'lib/need';
import { EthereumWallet, WALLET_TYPES } from 'lib/wallet';
import UploadButton from 'components/UploadButton';
import useLoginView from 'lib/useLoginView';

export default function Keystore({ className }) {
  useLoginView(WALLET_TYPES.KEYSTORE);

  // globals
  const { setWallet } = useWallet();

  const [error, setError] = useState();
  // inputs
  // keystore: Maybe<String>
  const [keystore, setKeystore] = useState(Maybe.Nothing());
  const passphraseInput = usePassphraseInput({
    name: 'password',
    label: 'Keystore password',
    autoFocus: true,
  });
  const passphrase = passphraseInput.data;

  const constructWallet = () => {
    try {
      const text = need.keystore(keystore);

      const json = JSON.parse(text);
      const privateKey = keythereum.recover(passphrase, json);

      const newWallet = new EthereumWallet(privateKey);
      setError();
      setWallet(Maybe.Just(newWallet));
    } catch (err) {
      setError(
        "Couldn't decrypt wallet. You may have entered an incorrect password."
      );
      setWallet(Maybe.Nothing());
    }
  };

  const handleKeystoreUpload = element => {
    const file = element.files.item(0);
    const reader = new FileReader();

    reader.onload = e => {
      const keystore = e.target.result;
      setKeystore(Maybe.Just(keystore));
    };

    const failure = _ => {
      setError('There was a problem uploading your Keystore file');
    };

    reader.onerror = failure;
    reader.onabort = failure;

    reader.readAsText(file);
  };

  return (
    <Grid className={className}>
      <Grid.Item full as={P}>
        Please upload your Ethereum keystore file. If your keystore file is
        encrypted with a password, you'll also need to enter that below.
      </Grid.Item>

      <Grid.Item full as={UploadButton} onChange={handleKeystoreUpload}>
        Upload Keystore file
      </Grid.Item>

      {error && (
        <Grid.Item full as={ErrorText} className="mt1">
          {error}
        </Grid.Item>
      )}

      <Grid.Item full as={Input} className="mt3" {...passphraseInput} />

      <Grid.Item
        full
        as={ForwardButton}
        solid
        className="mt3"
        disabled={Maybe.Nothing.hasInstance(keystore)}
        onClick={constructWallet}>
        Decrypt
      </Grid.Item>
    </Grid>
  );
}
