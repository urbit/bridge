import React, { useCallback, useMemo } from 'react';
import cn from 'classnames';
import { Just, Nothing } from 'folktale/maybe';
import { Grid, CheckboxInput } from 'indigo-react-local';

import { useWallet } from 'store/wallet';

import { walletFromMnemonic, WALLET_TYPES } from 'lib/wallet';
import useLoginView from 'lib/useLoginView';
import { MnemonicInput, HdPathInput, PassphraseInput } from 'form/Inputs';
import {
  composeValidator,
  buildMnemonicValidator,
  buildCheckboxValidator,
  buildPassphraseValidator,
  buildHdPathValidator,
} from 'form/validators';
import BridgeForm from 'form/BridgeForm';
import Condition from 'form/Condition';
import FormError from 'form/FormError';
import SubmitButton from 'form/SubmitButton';

export default function Mnemonic({ className, goHome }) {
  useLoginView(WALLET_TYPES.MNEMONIC);

  const {
    setWallet,
    setAuthMnemonic,
    walletHdPath,
    setWalletHdPath,
  } = useWallet();

  const validate = useMemo(
    () =>
      composeValidator({
        useAdvanced: buildCheckboxValidator(),
        mnemonic: buildMnemonicValidator(),
        passphrase: buildPassphraseValidator(),
        hdpath: buildHdPathValidator(),
      }),
    []
  );

  // when the properties change, re-derive wallet and set global state
  const onValues = useCallback(
    ({ valid, values }) => {
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

  const initialValues = useMemo(
    () => ({ hdpath: walletHdPath, useAdvanced: false }),
    [walletHdPath]
  );

  return (
    <Grid className={cn('mt4', className)}>
      <BridgeForm
        validate={validate}
        onValues={onValues}
        afterSubmit={goHome}
        initialValues={initialValues}>
        {({ handleSubmit }) => (
          <>
            <Grid.Item
              full
              as={MnemonicInput}
              name="mnemonic"
              label="BIP39 Mnemonic"
            />

            <Condition when="useAdvanced" is={true}>
              <Grid.Item
                full
                as={PassphraseInput}
                name="passphrase"
                label="Passphrase"
              />

              <Grid.Item full as={HdPathInput} name="hdpath" label="HD Path" />
            </Condition>

            <Grid.Item
              full
              as={CheckboxInput}
              name="useAdvanced"
              label="Passphrase & HD Path"
            />

            <Grid.Item full as={FormError} />

            <Grid.Item full as={SubmitButton} handleSubmit={handleSubmit}>
              Continue
            </Grid.Item>
          </>
        )}
      </BridgeForm>
    </Grid>
  );
}
