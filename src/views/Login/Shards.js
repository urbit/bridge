import { Just, Nothing } from 'folktale/maybe';
import React from 'react';
import * as kg from 'urbit-key-generation/dist/index';
import { Input } from 'indigo-react';

import View from 'components/View';
import {
  useTicketInput,
  usePassphraseInput,
  usePointInput,
} from 'components/Inputs';
import { ForwardButton } from 'components/Buttons';

import { useWallet } from 'store/wallet';

import { urbitWalletFromTicket, WALLET_TYPES } from 'lib/wallet';
import useLoginView from 'lib/useLoginView';

export default function Shards({ loginCompleted }) {
  useLoginView(WALLET_TYPES.SHARDS);

  const { wallet, setUrbitWallet } = useWallet();

  const pointInput = usePointInput({
    name: 'point',
    autoFocus: true,
  });
  const pointName = pointInput.data;
  const shard1Input = useTicketInput({
    name: 'shard1',
    label: 'Shard 1',
  });
  const shard1 = shard1Input.data;
  const shard2Input = useTicketInput({
    name: 'shard2',
    label: 'Shard 2',
  });
  const shard2 = shard2Input.data;
  const shard3Input = useTicketInput({
    name: 'shard3',
    label: 'Shard 3',
  });
  const shard3 = shard3Input.data;

  const passphraseInput = usePassphraseInput({
    name: 'passphrase',
    label: '(Optional) Wallet Passphrase',
  });
  const passphrase = passphraseInput.data;

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
    <>
      Enter your point and at least two of your three Urbit master ticket shards
      here. The index of the input field needs to match the index of the shard.
      <Input {...pointInput} />
      <Input {...shard1Input} />
      <Input {...shard2Input} />
      <Input {...shard3Input} />
      If your wallet requires a passphrase, you may enter it below.
      <Input {...passphraseInput} />
      <ForwardButton
        className="mt3"
        disabled={!ready}
        onClick={walletFromShards}>
        Unlock Wallet
      </ForwardButton>
      <ForwardButton
        className="mt3"
        disabled={Nothing.hasInstance(wallet)}
        onClick={loginCompleted}>
        Continue
      </ForwardButton>
    </>
  );
}
