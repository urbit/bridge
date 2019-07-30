import React, { useCallback } from 'react';
import cn from 'classnames';
import { Just, Nothing } from 'folktale/maybe';
import { Grid, CheckboxInput } from 'indigo-react';

import { useWallet } from 'store/wallet';

import { walletFromMnemonic, WALLET_TYPES } from 'lib/wallet';
import useLoginView from 'lib/useLoginView';
import { MnemonicInput, HdPathInput, PassphraseInput } from 'form/Inputs';
import BridgeForm from 'form/BridgeForm';
import Condition from 'form/Condition';

export default function Mnemonic({ className }) {
  useLoginView(WALLET_TYPES.MNEMONIC);

  const {
    setWallet,
    setAuthMnemonic,
    walletHdPath,
    setWalletHdPath,
  } = useWallet();

  // when the properties change, re-derive wallet and set global state
  const onValues = useCallback(
    ({ valid, values }) => {
      console.log(valid, values);
      if (valid) {
        setWalletHdPath(values.hdpath);
        setAuthMnemonic(Just(values.mnemonic));
        setWallet(
          walletFromMnemonic(values.mnemonic, values.hdpath, values.passphrase)
        );
      } else {
        setAuthMnemonic(Nothing());
        setWallet(Nothing());
      }
    },
    [setAuthMnemonic, setWallet, setWalletHdPath]
  );

  return (
    <Grid className={cn('mt4', className)}>
      <BridgeForm
        onValues={onValues}
        onSubmit={() => undefined}
        initialValues={{ hdpath: walletHdPath, advanced: false }}>
        {() => (
          <>
            <Grid.Item
              full
              as={MnemonicInput}
              name="mnemonic"
              label="BIP39 Mnemonic"
            />

            <Condition when="advanced" is={true}>
              <Grid.Item
                full
                as={PassphraseInput}
                name="passphrase"
                label="Passphrase"
              />

              <Grid.Item
                full
                as={HdPathInput}
                name="hdpath"
                label="HD Path"
                autoFocus
              />
            </Condition>

            <Grid.Item
              full
              as={CheckboxInput}
              name="advanced"
              label="Passphrase & HD Path"
            />
          </>
        )}
      </BridgeForm>

      {/* {useAdvanced && (
        <>
          <Grid.Item full as={Input} {...passphraseInput} />
          <Grid.Item full as={Input} {...hdPathInput} />
        </>
      )}

      <Grid.Item as={CheckboxInput} {...advancedInput} full /> */}
    </Grid>
  );
}
