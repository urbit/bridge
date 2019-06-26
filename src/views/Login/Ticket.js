import { Just, Nothing } from 'folktale/maybe';
import React, { useCallback, useState, useEffect } from 'react';
import * as azimuth from 'azimuth-js';
import * as ob from 'urbit-ob';
import { Input, AccessoryIcon } from 'indigo-react';

import View from 'components/View';
import {
  usePointInput,
  useTicketInput,
  usePassphraseInput,
} from 'components/Inputs';
import { ForwardButton } from 'components/Buttons';

import { useNetwork } from 'store/network';
import { useWallet } from 'store/wallet';
import { usePointCursor } from 'store/pointCursor';

import * as need from 'lib/need';
import { WALLET_TYPES, urbitWalletFromTicket } from 'lib/wallet';
import useWalletType from 'lib/useWalletType';

//TODO should be part of InputWithStatus component
const INPUT_STATUS = {
  SPIN: Symbol('SPIN'),
  GOOD: Symbol('GOOD'),
  FAIL: Symbol('FAIL'),
};

export default function Ticket({ advanced, loginCompleted }) {
  useWalletType(WALLET_TYPES.TICKET);
  // globals
  const { contracts } = useNetwork();
  const { wallet, setUrbitWallet } = useWallet();
  const { setPointCursor } = usePointCursor();

  // inputs
  const pointInput = usePointInput({
    name: 'point',
    label: 'Point',
    //TODO deduce point name from URL if we can, prefill input if we found it
    // initialValue: '~',
    autoFocus: true,
  });
  const pointName = pointInput.data;

  const ticketInput = useTicketInput({
    name: 'ticket',
    label: 'Master ticket',
  });
  const ticket = ticketInput.data;

  const passphraseInput = usePassphraseInput({
    name: 'passphrase',
    label: '(Optional) Wallet Passphrase',
  });
  const passphrase = passphraseInput.data;

  // display state
  const [ticketStatus, setTicketStatus] = useState(Nothing());

  //TODO maybe want to do this only on-go, because wallet derivation is slow...
  const verifyTicket = useCallback(
    async (pointName, ticket, passphrase) => {
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
    },
    [contracts, setUrbitWallet, setTicketStatus]
  );

  useEffect(() => {
    verifyTicket(pointName, ticket, passphrase);
  }, [verifyTicket, pointName, ticket, passphrase]);

  const canContinue = () => {
    // this is our only requirement, since we still want people with
    // non-standard wallet setups to be able to log in
    return Just.hasInstance(wallet);
  };

  const doContinue = () => {
    setPointCursor(Just(ob.patp2dec(pointName)));
    loginCompleted();
  };

  //TODO integrate into TicketInput?
  const displayTicketStatus = ticketStatus.matchWith({
    Nothing: () => <span />,
    Just: status => {
      switch (status.value) {
        case INPUT_STATUS.SPIN:
          return <AccessoryIcon.Pending />;
        case INPUT_STATUS.GOOD:
          return <AccessoryIcon.Success />;
        case INPUT_STATUS.FAIL:
          return <AccessoryIcon.Failure />;
        default:
          return null;
      }
    },
  });

  return (
    <View>
      <Input {...pointInput} />
      <Input {...ticketInput} accessory={displayTicketStatus} />
      {advanced && <Input {...passphraseInput} />}

      <ForwardButton
        className={'mt3'}
        disabled={!canContinue()}
        onClick={doContinue}>
        Continue
      </ForwardButton>
    </View>
  );
}
