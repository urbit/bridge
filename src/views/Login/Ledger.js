import React, { useCallback, useEffect, useState } from 'react';
import Maybe from 'folktale/maybe';
import { P, Text, Input, Grid, H5, CheckboxInput } from 'indigo-react';
import { times } from 'lodash';
import * as bip32 from 'bip32';
import Transport from '@ledgerhq/hw-transport-u2f';
import Eth from '@ledgerhq/hw-app-eth';
import * as secp256k1 from 'secp256k1';

import { ForwardButton } from 'components/Buttons';
import { InnerLabelDropdown } from 'components/old/Base';
import { useCheckboxInput, useHdPathInput } from 'components/Inputs';

import { useWallet } from 'store/wallet';

import {
  LEDGER_LIVE_PATH,
  LEDGER_LEGACY_PATH,
  chopHdPrefix,
  addHdPrefix,
} from 'lib/ledger';
import { WALLET_TYPES } from 'lib/wallet';
import useLoginView from 'lib/useLoginView';

const pathOptions = [
  { title: 'Ledger Live', value: LEDGER_LIVE_PATH },
  { title: 'Ledger Legacy', value: LEDGER_LEGACY_PATH },
];

const accountOptions = times(20, i => ({
  title: `Account #${i + 1}`,
  value: i,
}));

export default function Ledger({ className }) {
  useLoginView(WALLET_TYPES.LEDGER);

  const { setWallet, setWalletHdPath } = useWallet();

  // ledger has two derivation path _patterns_
  const [basePathPattern, setBasePathPattern] = useState(LEDGER_LIVE_PATH);
  // and then we want to be able to select an index within that path
  const [accountIndex, setAccountIndex] = useState(0);

  // custom toggle
  const [customPathInput, { data: useCustomPath }] = useCheckboxInput({
    name: 'customPath',
    label: 'Custom HD Path',
    autoComplete: 'off',
    initialValue: false,
  });

  // hd path input
  const [
    hdPathInput,
    { data: hdPath },
    { setValue: setHdPath },
  ] = useHdPathInput({
    name: 'hdpath',
    label: 'HD Path',
    initialValue: basePathPattern.replace(/x/g, 0),
  });

  const pollDevice = useCallback(async () => {
    const transport = await Transport.create();
    const eth = new Eth(transport);
    const path = chopHdPrefix(hdPath);

    try {
      const info = await eth.getAddress(path, false, true);
      const publicKey = Buffer.from(info.publicKey, 'hex');
      const chainCode = Buffer.from(info.chainCode, 'hex');
      const pub = secp256k1.publicKeyConvert(publicKey, true);
      const hd = bip32.fromPublicKey(pub, chainCode);
      setWallet(Maybe.Just(hd));
      setWalletHdPath(addHdPrefix(hdPath));
    } catch (error) {
      console.error(error);
      setWallet(Maybe.Nothing());
    }
  }, [hdPath, setWallet, setWalletHdPath]);

  // when the base path pattern or the account index changes
  // update the hd path in our input
  useEffect(() => {
    if (useCustomPath) {
      // updated by useForm
    } else {
      setHdPath(basePathPattern.replace(/x/g, accountIndex));
    }
  }, [useCustomPath, setHdPath, basePathPattern, accountIndex]);

  const basePathPatternTitle = pathOptions.find(
    o => o.value === basePathPattern
  ).title;
  const accountTitle = accountOptions.find(o => o.value === accountIndex).title;

  const isHTTPS = document.location.protocol === 'http:';

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
      <Grid.Item full as={H5}>
        Authenticate With Your Ledger
      </Grid.Item>
      <Grid.Item full as={Text} className="f6">
        Connect and authenticate to your Ledger, and then open the "Ethereum"
        application. If you're running on older firmware, make sure the "browser
        support" option is turned on. To sign transactions, you'll also need to
        enable the "contract data" option.
      </Grid.Item>

      {useCustomPath && (
        <Grid.Item full as={Input} className="mv3" {...hdPathInput} />
      )}

      {!useCustomPath && (
        <>
          <Grid.Item
            full
            as={InnerLabelDropdown}
            className="mv4"
            title="Derivation path"
            options={pathOptions}
            handleUpdate={setBasePathPattern}
            currentSelectionTitle={basePathPatternTitle}
          />
          <Grid.Item
            full
            as={InnerLabelDropdown}
            className="mt4"
            title="Account"
            options={accountOptions}
            handleUpdate={setAccountIndex}
            currentSelectionTitle={accountTitle}
          />
        </>
      )}

      <Grid.Item full as={CheckboxInput} {...customPathInput} />

      <Grid.Item
        full
        as={ForwardButton}
        solid
        className="mt3"
        onClick={pollDevice}>
        Authenticate
      </Grid.Item>
    </>
  );

  return (
    <Grid className={className}>
      {isHTTPS && renderHTTPS()}
      {!isHTTPS && renderHTTP()}
    </Grid>
  );
}
