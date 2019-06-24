import { Just, Nothing } from 'folktale/maybe';
import React, { useState } from 'react';
import * as kg from 'urbit-key-generation/dist/index';

import View from '../../components/View';
import {
  PointInput,
  TicketInput,
  PassphraseInput,
} from '../../components/Inputs';
import { ForwardButton } from '../../components/Buttons';

import { urbitWalletFromTicket } from '../../lib/wallet';
import { useWallet } from '../../store/wallet';

export default function Shards({ loginCompleted }) {
  const { wallet, setUrbitWallet } = useWallet();

  const [shard1, setShard1] = useState('');
  const [shard2, setShard2] = useState('');
  const [shard3, setShard3] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [pointName, setPointName] = useState('');

  const walletFromShards = async () => {
    const s1 = shard1 === '' ? undefined : shard1;
    const s2 = shard2 === '' ? undefined : shard2;
    const s3 = shard3 === '' ? undefined : shard3;

    let ticket = undefined;
    try {
      ticket = kg.combine([s1, s2, s3]);
    } catch (_) {
      // do nothing
    }

    if (ticket !== undefined) {
      const uhdw = await urbitWalletFromTicket(ticket, pointName, passphrase);
      setUrbitWallet(Just(uhdw));
    }
  };

  const shards = [shard1, shard2, shard3];
  const ready = shards.filter(x => x !== '').length > 1;

  return (
    <View>
      Enter your point and at least two of your three Urbit master ticket shards
      here. The index of the input field needs to match the index of the shard.
      <PointInput
        name="point"
        label="Point"
        initialValue={pointName}
        onValue={setPointName}
        autoFocus
      />
      <TicketInput
        name="shard1"
        label="Shard 1"
        initialValue={shard1}
        onValue={setShard1}></TicketInput>
      <TicketInput
        name="shard2"
        label="Shard 2"
        initialValue={shard2}
        onValue={setShard2}></TicketInput>
      <TicketInput
        name="shard3"
        label="Shard 3"
        initialValue={shard3}
        onValue={setShard3}></TicketInput>
      If your wallet requires a passphrase, you may enter it below.
      <PassphraseInput
        name="passphrase"
        label="(Optional) Wallet Passphrase"
        initialValue={passphrase}
        onValue={setPassphrase}
      />
      <ForwardButton
        className={'mt3'}
        disabled={!ready}
        onClick={walletFromShards}>
        {'Unlock Wallet →'}
      </ForwardButton>
      <ForwardButton
        className={'mt3'}
        disabled={Nothing.hasInstance(wallet)}
        onClick={loginCompleted}>
        {'Continue →'}
      </ForwardButton>
    </View>
  );
}
