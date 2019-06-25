import { Just, Nothing } from 'folktale/maybe';
import { Ok, Error } from 'folktale/result';
import React, { useState } from 'react';
import * as keythereum from 'keythereum';

import View from '../../components/View';
import { PassphraseInput } from '../../components/Inputs';
import { ForwardButton } from '../../components/Buttons';
import {
  InputCaption,
  UploadButton,
  H3,
  Warning,
} from '../../components/old/Base';

import * as need from '../../lib/need';
import { EthereumWallet } from '../../lib/wallet';
import { useWallet } from '../../store/wallet';

export default function Keystore({ loginCompleted }) {
  // globals
  const { wallet, setWallet } = useWallet();

  // inputs
  // keystore: Maybe<Result<String, String>>
  const [keystore, setKeystore] = useState(Nothing());
  const [password, setPassword] = useState('');
  const [decryptionProblem, setDecryptionProblem] = useState(false);

  const constructWallet = () => {
    try {
      const text = need.keystore(keystore);

      const json = JSON.parse(text);
      const privateKey = keythereum.recover(password, json);

      const wallet = new EthereumWallet(privateKey);
      setDecryptionProblem(false);
      setWallet(Just(wallet));
    } catch (err) {
      setDecryptionProblem(true);
      setWallet(Nothing());
    }
  };

  const handleKeystoreUpload = event => {
    const file = event.files.item(0);
    const reader = new FileReader();

    reader.onload = e => {
      const keystore = e.target.result;
      setKeystore(Just(Ok(keystore)));
    };

    const failure = _ => {
      const message = 'There was a problem uploading your Keystore file';
      setKeystore(Just(Error(message)));
    };

    reader.onerror = failure;
    reader.onabort = failure;

    reader.readAsText(file);
  };

  const uploadButtonClass = keystore.matchWith({
    Nothing: _ => 'bg-blue white',
    Just: ks =>
      ks.value.matchWith({
        Ok: _ => 'bg-green white',
        Error: _ => 'bg-yellow black',
      }),
  });

  const decryptMessage =
    decryptionProblem === false ? (
      <div />
    ) : (
      <Warning className="mt-8">
        <H3 style={{ marginTop: 0, paddingTop: 0 }}>
          Couldn't decrypt wallet.
        </H3>
        You may have entered an incorrect password.
      </Warning>
    );

  return (
    <View>
      <InputCaption>
        Please upload your Ethereum keystore file. If your keystore file is
        encrypted with a password, you'll also need to enter that below.
      </InputCaption>

      <UploadButton
        className={`${uploadButtonClass} mt3`}
        onChange={handleKeystoreUpload}>
        <div className="flex-center-all fs-4 h-11 pointer">
          Upload Keystore file
        </div>
      </UploadButton>

      <PassphraseInput
        name="password"
        label="Keystore password"
        initialValue={password}
        onValue={setPassword}
        autoFocus></PassphraseInput>

      <ForwardButton
        className="mt3"
        disabled={Nothing.hasInstance(keystore)}
        onClick={constructWallet}>
        Decrypt
      </ForwardButton>

      {decryptMessage}

      <ForwardButton
        className="mt3"
        disabled={Nothing.hasInstance(wallet)}
        onClick={loginCompleted}>
        Continue
      </ForwardButton>
    </View>
  );
}
