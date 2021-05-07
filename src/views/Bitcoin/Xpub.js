import React from 'react';
import { Grid, Text } from 'indigo-react';
import { useWallet } from 'store/wallet';

import { useLocalRouter } from 'lib/LocalRouter';

import ViewHeader from 'components/ViewHeader';
import View from 'components/View';
import WarningBox from 'components/WarningBox';

import CopiableAddressWrap from 'components/CopiableAddressWrap';
import Highlighted from 'components/Highlighted';

import * as need from 'lib/need';
import * as bitcoin from 'bitcoinjs-lib';
import * as bs58check from 'bs58check';
import { Buffer } from 'buffer';

function xpubToZpub(xpub) {
  var data = bs58check.decode(xpub);
  data = data.slice(4);
  data = Buffer.concat([Buffer.from('04b24746', 'hex'), data]);
  return bs58check.encode(data);
}

export default function Xpub() {
  const { pop } = useLocalRouter();
  const { urbitWallet } = useWallet();

  const { public: pubKey, chain } = need.urbitWallet(urbitWallet).bitcoin.keys;

  const zPub = xpubToZpub(
    bitcoin.bip32
      .fromPublicKey(
        Buffer.from(pubKey, 'hex'),
        Buffer.from(chain, 'hex'),
        bitcoin.networks.bitcoin
      )
      .toBase58()
  );

  return (
    <View pop={pop} inset>
      <Grid className="mt4">
        <Grid.Item full as={ViewHeader}>
          Bitcoin
        </Grid.Item>
        <Grid.Item full as={WarningBox}>
          We do not recommend using this feature for significant amounts of
          money, since your private keys are exposed to the browser.
        </Grid.Item>
        <Grid.Item full className="mt4" as={Text}>
          The public key derived from your master ticket.
        </Grid.Item>
        <Grid.Item full className="mt4" as={Text}>
          Paste it into landscape while setting up your wallet.
        </Grid.Item>
        <Grid.Item full className="mt4" as={Text}>
          <Highlighted>
            <CopiableAddressWrap>{zPub}</CopiableAddressWrap>
          </Highlighted>
        </Grid.Item>
      </Grid>
    </View>
  );
}
