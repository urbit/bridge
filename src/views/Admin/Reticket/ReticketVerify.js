import React, { useCallback, useMemo } from 'react';
import { Input, Text, Grid } from 'indigo-react';

import { ForwardButton } from 'components/Buttons';

import { useTicketInput } from 'lib/useInputs';
import { useLocalRouter } from 'lib/LocalRouter';
import { validateExactly } from 'lib/validators';
import { isDevelopment } from 'lib/flags';

const STUB_VERIFY_TICKET = isDevelopment;

export default function ReticketVerify({ newWallet }) {
  const { push, names } = useLocalRouter();

  const ticket = newWallet.value.wallet.ticket;
  const validators = useMemo(
    () => [validateExactly(ticket, 'Does not match expected master ticket.')],
    [ticket]
  );
  const [ticketInput, { pass }] = useTicketInput({
    name: 'ticket',
    label: 'New master ticket',
    initialValue: STUB_VERIFY_TICKET ? ticket : undefined,
    autoFocus: true,
    validators,
  });

  const goExecute = useCallback(() => push(names.EXECUTE), [push, names]);

  return (
    <Grid gap={4} className="mt4">
      <Grid.Item full as={Text}>
        Verify New Master Ticket
      </Grid.Item>
      <Grid.Item full as={Input} {...ticketInput} />
      <Grid.Item
        full
        as={ForwardButton}
        solid
        disabled={!pass}
        onClick={goExecute}>
        Verify & Reticket
      </Grid.Item>
    </Grid>
  );
}
