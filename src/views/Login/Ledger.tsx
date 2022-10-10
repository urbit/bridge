import React, { useCallback, useMemo } from 'react';
import cn from 'classnames';
import { Just } from 'folktale/maybe';
import { P, Text, Grid, H5, CheckboxInput, SelectInput } from 'indigo-react';
import { times } from 'lodash';
import { bip32 } from 'bitcoinjs-lib';
import Transport from '@ledgerhq/hw-transport-u2f';
import Eth from '@ledgerhq/hw-app-eth';
import { publicKeyConvert } from 'secp256k1';

import { useWallet } from 'store/wallet';

import {
  LEDGER_LIVE_PATH,
  LEDGER_LEGACY_PATH,
  chopHdPrefix,
  addHdPrefix,
} from 'lib/ledger';
import { WALLET_TYPES } from 'lib/constants';
import useLoginView from 'lib/useLoginView';
import useBreakpoints from 'lib/useBreakpoints';

import {
  composeValidator,
  buildCheckboxValidator,
  buildHdPathValidator,
  buildSelectValidator,
} from 'form/validators';
import BridgeForm from 'form/BridgeForm';
import FormError from 'form/FormError';
import SubmitButton from 'form/SubmitButton';
import Condition from 'form/Condition';
import { FORM_ERROR } from 'final-form';
import { HdPathInput } from 'form/Inputs';
import { getAuthToken } from 'lib/authToken';

const PATH_OPTIONS = [
  { text: 'Ledger Live', value: LEDGER_LIVE_PATH },
  { text: 'Ledger Legacy', value: LEDGER_LEGACY_PATH },
];

const ACCOUNT_OPTIONS = times(20, i => ({
  text: `Account #${i + 1}`,
  value: i,
}));

interface LedgerProps {
  className: string;
  goHome: VoidFunction;
}

export default function Ledger({ className, goHome }: LedgerProps) {
  useLoginView(WALLET_TYPES.LEDGER);

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
        derivationpath: buildSelectValidator(PATH_OPTIONS),
        account: buildSelectValidator(ACCOUNT_OPTIONS),
        hdpath: buildHdPathValidator(),
      }),
    []
  );

  const onSubmit = useCallback(
    async values => {
      const transport = await Transport.create();
      const eth = new Eth(transport);
      const path = chopHdPrefix(values.hdpath);

      try {
        const info = await eth.getAddress(path, false, true);
        const publicKey = Buffer.from(info.publicKey, 'hex');
        const chainCode = Buffer.from(info.chainCode!.toString(), 'hex');
        const pub = Buffer.from(publicKeyConvert(publicKey, true));
        const hd = bip32.fromPublicKey(pub, chainCode);
        setWallet(Just(hd));
        setWalletHdPath(addHdPrefix(values.hdpath));
        if (skipLoginSigning) {
          setFakeToken();
          return;
        }

        const authToken = await getAuthToken({
          walletType: WALLET_TYPES.LEDGER,
          walletHdPath: addHdPrefix(values.hdpath),
        });
        setAuthToken(Just(authToken));
      } catch (error) {
        console.error(error);
        return { [FORM_ERROR]: error.message };
      }
    },
    [setAuthToken, setFakeToken, setWallet, setWalletHdPath, skipLoginSigning]
  );

  const onValues = useCallback(({ valid, values, form }) => {
    if (!valid) {
      return;
    }

    // when the base path pattern or the account index changes
    // update the hd path in our input
    if (!values.useCustomPath) {
      form.change(
        'hdpath',
        values.derivationpath.replace(/x/g, values.account)
      );
    }
  }, []);

  const initialValues = useMemo(
    () => ({
      useCustomPath: false,
      hdpath: PATH_OPTIONS[0].value.replace(
        /x/g,
        ACCOUNT_OPTIONS[0].value.toString()
      ),
      derivationpath: PATH_OPTIONS[0].value,
      account: ACCOUNT_OPTIONS[0].value,
    }),
    []
  );

  //@ts-ignore
  const full = useBreakpoints([true, true, false]);
  //@ts-ignore
  const half = useBreakpoints([false, false, true]);
  const isHTTPS = document.location.protocol === 'https:';

  // when not on https, tell user how to get there
  const renderHTTP = () => (
    <>
      <Grid.Item full as={H5}>
        Running on HTTP?
      </Grid.Item>

      <Grid.Item full as={P}>
        To authenticate and sign transactions with a Ledger, Bridge must be
        serving over HTTPS on localhost. You can do this via the following:
      </Grid.Item>

      <Grid.Item full as="ol">
        <li>
          Install{' '}
          <a
            target="_blank"
            href="https://github.com/FiloSottile/mkcert"
            rel="noopener noreferrer">
            mkcert
          </a>
        </li>
        <li className="mt3">
          Install a local certificate authority via <code>mkcert -install</code>
        </li>
        <li className="mt3">
          In your <code>bridge</code> directory, generate a certificate valid
          for localhost via <code>mkcert localhost</code>. This will produce two
          files: <code>localhost.pem</code>, the local certificate, and
          <code>localhost-key.pem</code> , its corresponding private key.
        </li>
        <li className="mt3">
          Run <code>python bridge-https.py</code>
        </li>
        <li className="mt3">Return to this page.</li>
      </Grid.Item>
    </>
  );

  const renderHTTPS = () => (
    <>
      <Grid.Item full as={Text} className="f6 gray4 mb3">
        Connect and authenticate to your Ledger, and then open the "Ethereum"
        application. If you're running on older firmware, make sure the "browser
        support" option is turned on. To sign transactions, you'll also need to
        enable the "contract data" option. You will be prompted to sign a
        message. This allows Bridge to operate correctly. Never sign this
        message outside of Bridge.
      </Grid.Item>

      <Grid.Item full as={Text} className="f6 gray4 mb3">
        Connecting a Ledger directly is no longer supported in Chrome-based
        browsers. To log in to Bridge with a Ledger, either use Firefox, add
        your Ledger to Metamask, or connect through another kind of wallet.
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
              <Grid.Item full as={HdPathInput} name="hdpath" label="HD Path" />
            </Condition>

            <Condition when="useCustomPath" is={false}>
              <Grid.Item
                full={full}
                half={half && 1}
                as={SelectInput}
                className={cn({ pr1: half })}
                name="derivationpath"
                label="Derivation Path"
                placeholder="Choose path pattern..."
                options={PATH_OPTIONS}
              />

              <Grid.Item
                full={full}
                half={half && 2}
                as={SelectInput}
                className={cn({ pl1: half })}
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
    </>
  );

  return (
    <Grid className={className}>{isHTTPS ? renderHTTPS() : renderHTTP()}</Grid>
  );
}
