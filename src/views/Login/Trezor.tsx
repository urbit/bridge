import React, { useCallback, useMemo } from 'react';
import { Just } from 'folktale/maybe';
import { bip32 } from 'bitcoinjs-lib';
import { publicKeyConvert } from 'secp256k1';
import { times } from 'lodash';
import TrezorConnect, { HDNodeResponse } from 'trezor-connect';
import { Text, Grid, CheckboxInput, SelectInput } from 'indigo-react';

import { useWallet } from 'store/wallet';

import { TREZOR_PATH } from 'lib/trezor';
import { WALLET_TYPES } from 'lib/constants';
import useLoginView from 'lib/useLoginView';
import { getAuthToken } from 'lib/authToken';

import {
  composeValidator,
  buildCheckboxValidator,
  buildSelectValidator,
  buildHdPathValidator,
} from 'form/validators';
import BridgeForm from 'form/BridgeForm';
import Condition from 'form/Condition';
import FormError from 'form/FormError';

import SubmitButton from 'form/SubmitButton';
import { FORM_ERROR } from 'final-form';
import { HdPathInput } from 'form/Inputs';

const ACCOUNT_OPTIONS = times(20, i => ({
  text: `Account #${i + 1}`,
  value: i,
}));

interface TrezorProps {
  className: string;
  goHome: VoidFunction;
}

// see Ledger.js for context — Trezor is basicaly Ledger with less complexity
export default function Trezor({ className, goHome }: TrezorProps) {
  useLoginView(WALLET_TYPES.TREZOR);

  const {
    setWallet,
    setWalletHdPath,
    setAuthToken,
    setFakeToken,
    skipLoginSigning,
  }: any = useWallet();

  const validate = useMemo(
    () =>
      composeValidator({
        useCustomPath: buildCheckboxValidator(),
        account: buildSelectValidator(ACCOUNT_OPTIONS),
        hdPath: buildHdPathValidator(),
      }),
    []
  );

  const onSubmit = useCallback(
    async values => {
      TrezorConnect.manifest({
        email: 'bridge-trezor@urbit.org',
        appUrl: 'https://github.com/urbit/bridge',
      });

      const { success, payload } = await TrezorConnect.getPublicKey({
        path: values.hdPath,
      });

      if (!success) {
        return { [FORM_ERROR]: 'Failed to authenticate with your Trezor.' };
      }

      // At this point, request is succesful, so payload will be
      // type HDNodeResponse (seems Trezor lib's TS types are slightly off)
      const publicKey = Buffer.from(
        (payload as HDNodeResponse).publicKey,
        'hex'
      );
      const chainCode = Buffer.from(
        (payload as HDNodeResponse).chainCode,
        'hex'
      );

      const pub = Buffer.from(publicKeyConvert(publicKey, true));
      const hd = bip32.fromPublicKey(pub, chainCode);
      setWallet(Just(hd));
      setWalletHdPath(values.hdPath);

      if (skipLoginSigning) {
        setFakeToken();
        return;
      }

      const authToken = await getAuthToken({
        walletType: WALLET_TYPES.TREZOR,
        walletHdPath: values.hdPath,
      });

      setAuthToken(Just(authToken));
    },
    [setAuthToken, setFakeToken, setWallet, setWalletHdPath, skipLoginSigning]
  );

  const onValues = useCallback(({ valid, values, form }) => {
    if (!valid) {
      return;
    }

    if (!values.useCustomPath) {
      form.change('hdPath', TREZOR_PATH.replace(/x/g, values.account));
    }
  }, []);

  const initialValues = useMemo(
    () => ({
      useCustomPath: false,
      hdPath: TREZOR_PATH.replace(/x/g, ACCOUNT_OPTIONS[0].value.toString()),
      account: ACCOUNT_OPTIONS[0].value,
    }),
    []
  );

  return (
    <Grid className={className}>
      <Grid.Item full as={Text} className="f6 gray4 mb3">
        Connect and authenticate to your Trezor. If you'd like to use a custom
        derivation path, you may enter it below. Upon login, you will prompted
        to sign the message "Bridge Authentication Token". This allows Bridge to
        operate correctly. Never sign this message outside of Bridge.
      </Grid.Item>

      <BridgeForm
        validate={validate}
        onValues={onValues}
        onSubmit={onSubmit}
        afterSubmit={goHome}
        initialValues={initialValues}>
        {({ handleSubmit, submitting }: any) => (
          <>
            <Condition when="useCustomPath" is={true}>
              <Grid.Item full as={HdPathInput} name="hdPath" label="HD Path" />
            </Condition>

            <Condition when="useCustomPath" is={false}>
              <Grid.Item
                full
                as={SelectInput}
                name="account"
                label="Account"
                placeholder="Choose account..."
                options={ACCOUNT_OPTIONS}
              />
            </Condition>

            <Grid.Item
              full
              as={CheckboxInput}
              className="mv3"
              name="useCustomPath"
              label="Custom HD Path"
            />

            <Grid.Item full as={FormError} />

            <Grid.Item full as={SubmitButton} handleSubmit={handleSubmit}>
              {!submitting && 'Authenticate'}
              {submitting && 'Please check your device'}
            </Grid.Item>
          </>
        )}
      </BridgeForm>
    </Grid>
  );
}
