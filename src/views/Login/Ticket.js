import Maybe from 'folktale/maybe';
import React, { useCallback, useState, useEffect } from 'react';
import * as azimuth from 'azimuth-js';
import * as ob from 'urbit-ob';
import * as kg from 'urbit-key-generation/dist/index';
import { Input, Grid, CheckboxInput } from 'indigo-react';

import {
  usePointInput,
  useTicketInput,
  usePassphraseInput,
  useCheckboxInput,
} from 'components/Inputs';

import { useNetwork } from 'store/network';
import { useWallet } from 'store/wallet';
import { usePointCursor } from 'store/pointCursor';

import * as need from 'lib/need';
import { WALLET_TYPES, urbitWalletFromTicket } from 'lib/wallet';
import useImpliedPoint from 'lib/useImpliedPoint';
import useLoginView from 'lib/useLoginView';

export default function Ticket({ className }) {
  useLoginView(WALLET_TYPES.TICKET);
  // globals
  const { contracts } = useNetwork();
  const { setUrbitWallet } = useWallet();
  const { setPointCursor } = usePointCursor();
  const impliedPoint = useImpliedPoint();

  // inputs

  // point
  const pointInput = usePointInput({
    name: 'point',
    initialValue: impliedPoint,
    autoFocus: true,
  });
  const pointName = pointInput.data;

  // passphrase
  const passphraseInput = usePassphraseInput({
    name: 'passphrase',
    label: '(Optional) Wallet Passphrase',
  });
  const passphrase = passphraseInput.data;

  const hasPassphraseInput = useCheckboxInput({
    name: 'has-passphrase',
    label: 'Passphrase',
    initialValue: false,
  });

  // ticket
  const [error, setError] = useState();
  const [deriving, setDeriving] = useState(false);
  const ticketInput = useTicketInput({
    name: 'ticket',
    label: 'Master Ticket',
    error,
    deriving,
  });
  const ticket = ticketInput.data;

  // shards
  const shardsInput = useCheckboxInput({
    name: 'shards',
    label: 'Shards',
    initialValue: false,
  });

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

  const isUsingShards = !!shardsInput.data;
  const shards = [shard1, shard2, shard3];
  const shardsReady = shards.filter(x => x !== '').length > 1;

  // TODO: maybe want to do this only on-go, because wallet derivation is slow...
  const deriveWalletFromTicket = useCallback(async () => {
    // clear states
    setError();
    setDeriving(true);
    setUrbitWallet(Maybe.Nothing());

    if (!ob.isValidPatq(ticket) || !ob.isValidPatp(pointName)) {
      setDeriving(false);
      return;
    }

    const _contracts = need.contracts(contracts);
    const pointNumber = ob.patp2dec(pointName);
    const urbitWallet = await urbitWalletFromTicket(
      ticket,
      pointName,
      passphrase
    );
    const [isOwner, isTransferProxy] = await Promise.all([
      azimuth.azimuth.isOwner(
        _contracts,
        pointNumber,
        urbitWallet.ownership.keys.address
      ),
      azimuth.azimuth.isTransferProxy(
        _contracts,
        pointNumber,
        urbitWallet.ownership.keys.address
      ),
    ]);

    if (!isOwner && !isTransferProxy) {
      setError(
        'This ticket is not the owner of or transfer proxy for this point.'
      );
      setDeriving(false);
      return;
    }

    setUrbitWallet(Maybe.Just(urbitWallet));
    setPointCursor(Maybe.Just(ob.patp2dec(pointName)));
    setDeriving(false);
  }, [
    pointName,
    ticket,
    passphrase,
    contracts,
    setUrbitWallet,
    setPointCursor,
    setDeriving,
  ]);

  const deriveWalletFromShards = useCallback(async () => {
    if (!shardsReady) {
      return;
    }

    const s1 = shard1 || undefined;
    const s2 = shard2 || undefined;
    const s3 = shard3 || undefined;

    try {
      const ticket = kg.combine([s1, s2, s3]);
      const uhdw = await urbitWalletFromTicket(ticket, pointName, passphrase);
      setUrbitWallet(Maybe.Just(uhdw));
    } catch (_) {
      // do nothing
    }
  }, [
    passphrase,
    pointName,
    shardsReady,
    setUrbitWallet,
    shard1,
    shard2,
    shard3,
  ]);

  // use shards if
  useEffect(() => {
    if (isUsingShards && shardsReady) {
      deriveWalletFromShards();
    }
  }, [isUsingShards, shardsReady, deriveWalletFromShards]);

  // verify ticket if not using shards
  useEffect(() => {
    if (!isUsingShards) {
      deriveWalletFromTicket();
    }
  }, [isUsingShards, deriveWalletFromTicket]);

  return (
    <Grid className={className}>
      <Grid.Item full as={Input} {...pointInput} />

      {!isUsingShards && <Grid.Item full as={Input} {...ticketInput} />}
      {isUsingShards && (
        <>
          <Grid.Item full as={Input} {...shard1Input} />
          <Grid.Item full as={Input} {...shard2Input} />
          <Grid.Item full as={Input} {...shard3Input} />
        </>
      )}
      {hasPassphraseInput.data && (
        <Grid.Item full as={Input} {...passphraseInput} />
      )}

      <Grid.Item full as={CheckboxInput} {...hasPassphraseInput} />
      <Grid.Item full as={CheckboxInput} {...shardsInput} />
    </Grid>
  );
}
