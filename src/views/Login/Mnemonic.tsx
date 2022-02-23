import React, { useCallback, useState, useMemo } from 'react';
import cn from 'classnames';
import { Just, Nothing } from 'folktale/maybe';
import { Grid } from 'indigo-react';

import { useWallet } from 'store/wallet';

import { walletFromMnemonic } from 'lib/wallet';
import { DEFAULT_HD_PATH, ONE_SECOND, WALLET_TYPES } from 'lib/constants';
import useLoginView from 'lib/useLoginView';
import { MnemonicInput, HdPathInput, PassphraseInput } from 'form/Inputs';
import {
  composeValidator,
  buildAnyMnemonicValidator,
  buildMnemonicValidator,
  buildCheckboxValidator,
  buildPassphraseValidator,
  buildHdPathValidator,
} from 'form/validators';
import BridgeForm from 'form/BridgeForm';
import FormError from 'form/FormError';
import SubmitButton from 'form/SubmitButton';
import Window from 'components/L2/Window/Window';
import HeaderPane from 'components/L2/Window/HeaderPane';
import BodyPane from 'components/L2/Window/BodyPane';
import AdvancedOptions from 'components/L2/Headers/AdvancedOptions';
import { Row } from '@tlon/indigo-react';
import { debounce } from 'lodash';

interface MnemonicProps {
  className?: string;
  goHome: () => void;
}

export default function Mnemonic({ className, goHome }: MnemonicProps) {
  useLoginView(WALLET_TYPES.MNEMONIC);

  const {
    setWallet,
    setAuthMnemonic,
    setWalletHdPath,
    setUseLegacyTokenSigning,
    useLegacyTokenSigning,
  }: any = useWallet();

  const [skipValidation, setSkipValidation] = useState(false);
  const [phraseHdPath, setPhraseHdPath] = useState(false);

  const validate = useMemo(() => {
    const mnemonicValidator = skipValidation
      ? buildAnyMnemonicValidator()
      : buildMnemonicValidator();
    return composeValidator({
      useAdvanced: buildCheckboxValidator(),
      mnemonic: mnemonicValidator,
      passphrase: buildPassphraseValidator(),
      hdpath: buildHdPathValidator(),
    });
  }, [skipValidation]);

  // when the properties change, re-derive wallet and set global state
  const debouncedOnValues = debounce(({ valid, values }) => {
    if (valid) {
      setWalletHdPath(values.hdpath);
      setAuthMnemonic(Just(values.mnemonic));
      setWallet(
        walletFromMnemonic(
          values.mnemonic,
          values.hdpath,
          values.passphrase,
          skipValidation
        )
      );
    } else {
      setAuthMnemonic(Nothing());
      setWallet(Nothing());
    }
  }, ONE_SECOND);

  const onValues = useCallback(debouncedOnValues, [
    setAuthMnemonic,
    setWallet,
    setWalletHdPath,
    skipValidation,
  ]);

  const initialValues = {
    hdpath: DEFAULT_HD_PATH,
    useAdvanced: false,
    anyMnemonic: false,
  };
  const advancedOptions = [
    {
      selected: skipValidation,
      key: 'skipValidation',
      label: 'Skip Passphrase Validation',
      onClick: () => setSkipValidation(!skipValidation),
    },
    {
      selected: phraseHdPath,
      key: 'phraseHdPath',
      label: 'Passphrase & HD Path',
      onClick: () => setPhraseHdPath(!phraseHdPath),
    },
    {
      selected: useLegacyTokenSigning,
      key: 'useLegacyTokenSigning',
      label: 'Use Legacy Compatibility',
      onClick: () => setUseLegacyTokenSigning(!useLegacyTokenSigning),
    },
  ];

  return (
    <Window className="master-ticket">
      <HeaderPane>
        <Row className="header-row">
          <h5>Recovery Phrase</h5>
          <AdvancedOptions options={advancedOptions} />
        </Row>
      </HeaderPane>
      <BodyPane>
        <Grid className={cn(className, 'input-form')}>
          <BridgeForm
            validate={validate}
            onValues={onValues}
            afterSubmit={goHome}
            initialValues={initialValues}>
            {({ handleSubmit }: any) => (
              <Grid.Item full className="flex-col justify-between">
                <Grid.Item full>
                  <Grid.Item full as={MnemonicInput} name="mnemonic" />

                  {phraseHdPath && (
                    <>
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
                      />
                    </>
                  )}

                  <Grid.Item full as={FormError} />
                </Grid.Item>

                <Grid.Item
                  full
                  as={SubmitButton}
                  handleSubmit={handleSubmit}
                  center>
                  Log In
                </Grid.Item>
              </Grid.Item>
            )}
          </BridgeForm>
        </Grid>
      </BodyPane>
    </Window>
  );
}
