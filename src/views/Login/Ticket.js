import { Just, Nothing } from 'folktale/maybe';
import React, { useState, useEffect } from 'react';
import * as azimuth from 'azimuth-js';
import * as ob from 'urbit-ob';

import View from 'components/View';
import { PointInput, TicketInput, PassphraseInput } from 'components/Inputs';
import { ForwardButton } from 'components/Buttons';

import * as need from 'lib/need';
import { WALLET_TYPES, urbitWalletFromTicket } from 'lib/wallet';

import { useNetwork } from 'store/network';
import { useWallet } from 'store/wallet';
import { usePointCursor } from 'store/pointCursor';

//TODO should be part of InputWithStatus component
const INPUT_STATUS = {
  SPIN: Symbol('SPIN'),
  GOOD: Symbol('GOOD'),
  FAIL: Symbol('FAIL'),
};

export default function Ticket({ advanced, loginCompleted }) {
  // globals
  const { contracts } = useNetwork();
  const { wallet, setWalletType, setUrbitWallet } = useWallet();
  const { setPointCursor } = usePointCursor();

  // inputs
  //TODO deduce point name from URL if we can, prefill input if we found it
  const [pointName, setPointName] = useState('');
  const [ticket, setTicket] = useState('');
  const [passphrase, setPassphrase] = useState('');

  // display state
  const [ticketStatus, setTicketStatus] = useState(Nothing());

  useEffect(() => {
    verifyTicket(pointName, ticket, passphrase);
    return () => {};
  }, [pointName, ticket, passphrase]);

  //TODO maybe want to do this only on-go, because wallet derivation is slow...
  const verifyTicket = async (pointName, ticket, passphrase) => {
    setUrbitWallet(Nothing());
    if (!ob.isValidPatq(ticket) || !ob.isValidPatp(pointName)) {
      setTicketStatus(Nothing());
      return;
    }
    setTicketStatus(Just(INPUT_STATUS.SPIN));
    const _contracts = need.contracts(contracts);
    const pointNumber = ob.patp2dec(pointName);
    const uhdw = await urbitWalletFromTicket(ticket, pointName, passphrase);
    const isOwner = azimuth.azimuth.isOwner(
      _contracts,
      pointNumber,
      uhdw.ownership.keys.address
    );
    const isTransferProxy = azimuth.azimuth.isTransferProxy(
      _contracts,
      pointNumber,
      uhdw.ownership.keys.address
    );
    setUrbitWallet(Just(uhdw));
    const newStatus =
      (await isOwner) || (await isTransferProxy)
        ? INPUT_STATUS.GOOD
        : INPUT_STATUS.FAIL;
    setTicketStatus(Just(newStatus));
  };

  const canContinue = () => {
    // this is our only requirement, since we still want people with
    // non-standard wallet setups to be able to log in
    return Just.hasInstance(wallet);
  };

  const doContinue = () => {
    setWalletType(WALLET_TYPES.TICKET);
    setPointCursor(Just(ob.patp2dec(pointName)));
    loginCompleted();
  };

  const pointInput = (
    <PointInput
      name="point"
      label="Point"
      initialValue={pointName}
      onValue={setPointName}
      autoFocus
    />
  );

  //TODO integrate into TicketInput?
  const displayTicketStatus = ticketStatus.matchWith({
    Nothing: () => <span />,
    Just: status => {
      switch (status.value) {
        case INPUT_STATUS.SPIN:
          return <span>⋯</span>;
        case INPUT_STATUS.GOOD:
          return <span>✓</span>;
        case INPUT_STATUS.FAIL:
          return <span>𐄂</span>;
        default:
          throw new Error('weird input status ' + status.value);
      }
    },
  });

  const ticketInput = (
    <TicketInput
      name="ticket"
      label="Master ticket"
      initialValue={ticket}
      onValue={setTicket}
    />
  );

  const passphraseInput = !advanced ? null : (
    <PassphraseInput
      name="passphrase"
      label="(Optional) Wallet Passphrase"
      initialValue={passphrase}
      onValue={setPassphrase}
    />
  );

  return (
    <View>
      {pointInput}
      {ticketInput}
      {passphraseInput}

      <ForwardButton
        className={'mt3'}
        disabled={!canContinue()}
        onClick={doContinue}>
        Continue
      </ForwardButton>
    </View>
  );
}
