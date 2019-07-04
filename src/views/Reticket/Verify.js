import React, { useCallback } from 'react';
import { Input, AccessoryIcon } from 'indigo-react';

import View from 'components/View';
import { useTicketInput } from 'components/Inputs';
import { ForwardButton } from 'components/Buttons';

import { useLocalRouter } from 'lib/LocalRouter';

export default function Verify({ STEP_NAMES, newWallet }) {
  const { push } = useLocalRouter();

  const ticketInput = useTicketInput({
    name: 'ticket',
    label: 'New master ticket',
  });
  const ticket = ticketInput.data;

  const next = useCallback(() => push(STEP_NAMES.RETICKET), [push, STEP_NAMES]);

  const matches = newWallet.value.wallet.ticket === ticket;

  const displayTicketStatus = matches ? (
    <AccessoryIcon.Success />
  ) : (
    <AccessoryIcon.Failure />
  );

  return (
    <View>
      Prove that you downloaded the new secrets!
      <Input {...ticketInput} accessory={displayTicketStatus} />
      <ForwardButton disabled={!matches} onClick={next}>
        Reticket
      </ForwardButton>
    </View>
  );
}
