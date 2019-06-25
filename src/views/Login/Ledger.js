import * as bip32 from 'bip32';
import React, { useState } from 'react';
import { times } from 'lodash';
import Maybe from 'folktale/maybe';
import Transport from '@ledgerhq/hw-transport-u2f';
import Eth from '@ledgerhq/hw-app-eth';
import * as secp256k1 from 'secp256k1';
import { H1, H2, P, Input } from 'indigo-react';

import View from 'components/View';
import { ForwardButton } from 'components/Buttons';
import { InnerLabelDropdown } from 'components/old/Base';

import { useWallet } from 'store/wallet';

import { LEDGER_LIVE_PATH, LEDGER_LEGACY_PATH } from 'lib/ledger';
import useWalletType from 'lib/useWalletType';
import { WALLET_TYPES } from 'lib/wallet';

const pathOptions = [
  { title: 'Ledger Live', value: LEDGER_LIVE_PATH },
  { title: 'Ledger Legacy', value: LEDGER_LEGACY_PATH },
  { title: 'Custom path', value: 'custom' },
];

const chopHdPrefix = str => (str.slice(0, 2) === 'm/' ? str.slice(2) : str);

const addHdPrefix = str => (str.slice(0, 2) === 'm/' ? str : 'm/' + str);

export default function Ledger({ loginCompleted }) {
  useWalletType(WALLET_TYPES.LEDGER);

  const { wallet, setWallet, setWalletHdPath } = useWallet();

  const [basePath, setBasePath] = useState(LEDGER_LIVE_PATH);
  const [account, setAccount] = useState(0);
  const [hdPath, setHdPath] = useState(LEDGER_LIVE_PATH.replace(/x/g, 0));

  const updateHdPath = (basePath, account) => {
    if (basePath !== 'custom') {
      setHdPath(basePath.replace(/x/g, account));
    }
  };

  const handlePathSelection = basePath => {
    setBasePath(basePath);
    updateHdPath(basePath, account);
  };

  const handleAccountSelection = account => {
    setAccount(account);
    updateHdPath(basePath, account);
  };

  const pollDevice = async () => {
    const transport = await Transport.create();
    const eth = new Eth(transport);
    const path = chopHdPrefix(hdPath);

    eth.getAddress(path, false, true).then(
      info => {
        const publicKey = Buffer.from(info.publicKey, 'hex');
        const chainCode = Buffer.from(info.chainCode, 'hex');
        const pub = secp256k1.publicKeyConvert(publicKey, true);
        const hd = bip32.fromPublicKey(pub, chainCode);
        setWallet(Maybe.Just(hd));
        setWalletHdPath(addHdPrefix(hdPath));
      },
      _ => {
        setWallet(Maybe.Nothing());
      }
    );
  };

  const basePathTitle = pathOptions.find(o => o.value === basePath).title;

  const accountOptions = times(20, i => ({
    title: `Account #${i + 1}`,
    value: i,
  }));
  const accountTitle = accountOptions.find(o => o.value === account).title;

  const basePathSelection = (
    <InnerLabelDropdown
      className="mt-8"
      options={pathOptions}
      handleUpdate={handlePathSelection}
      title="Derivation path"
      currentSelectionTitle={basePathTitle}
      fullWidth={true}
    />
  );

  const truePathSelection =
    basePath === 'custom' ? (
      <Input
        className="mt3"
        name="hdPath"
        label="HD path"
        autocomplete="off"
        initialValue={addHdPrefix(hdPath)}
        onValue={setHdPath}
      />
    ) : (
      <InnerLabelDropdown
        className="mt-4"
        prop-size="md"
        prop-format="innerLabel"
        options={accountOptions}
        handleUpdate={handleAccountSelection}
        title="Account"
        currentSelectionTitle={accountTitle}
        fullWidth={true}
      />
    );

  // when not on https, tell user how to get there
  const body =
    document.location.protocol !== 'https:' ? (
      <>
        <H2>Running on HTTP?</H2>

        <P>
          To authenticate and sign transactions with a Ledger, Bridge must be
          serving over HTTPS on localhost. You can do this via the following:
        </P>

        <ol className="measure-md">
          <li className="mt-4">
            Install
            <a target="_blank" href="https://github.com/FiloSottile/mkcert">
              mkcert
            </a>
          </li>
          <li className="mt-4">
            Install a local certificate authority via{' '}
            <code>mkcert -install</code>
          </li>
          <li className="mt-4">
            In your <code>bridge</code> directory, generate a certificate valid
            for localhost via <code>mkcert localhost</code>. This will produce
            two files: <code>localhost.pem</code>, the local certificate, and
            <code>localhost-key.pem</code> , its corresponding private key.
          </li>
          <li className="mt-4">
            Run <code>python bridge-https.py</code>
          </li>
        </ol>
      </>
    ) : (
      <>
        <P>
          Connect and authenticate to your Ledger, and then open the "Ethereum"
          application. If you're running on older firmware, make sure the
          "browser support" option is turned on. To sign transactions, you'll
          also need to enable the "contract data" option.
        </P>

        <P>
          If you'd like to use a custom derivation path, you may enter it below.
        </P>

        {basePathSelection}
        {truePathSelection}

        <ForwardButton className={'mt3'} onClick={pollDevice}>
          {'Authenticate'}
        </ForwardButton>

        <ForwardButton
          className={'mt3'}
          disabled={Maybe.Nothing.hasInstance(wallet)}
          onClick={loginCompleted}>
          {'Continue'}
        </ForwardButton>
      </>
    );

  return (
    <View>
      <H1>Authenticate With Your Ledger</H1>
      {body}
    </View>
  );
}
