import React, { useCallback, useMemo } from 'react';
import { Text, Grid } from 'indigo-react';

import { useLocalRouter } from 'lib/LocalRouter';
import { validateExactly } from 'lib/validators';
import { isDevelopment } from 'lib/flags';

import BridgeForm from 'form/BridgeForm';
import {
  TicketInput,
  composeValidator,
  buildTicketValidator,
} from 'form/Inputs';
import SubmitButton from 'form/SubmitButton';

const STUB_VERIFY_TICKET = isDevelopment;

export default function ReticketVerify({ newWallet }) {
  const { push, names } = useLocalRouter();

  const ticket = newWallet.value.wallet.ticket;
  const validate = useMemo(
    () =>
      composeValidator({
        ticket: buildTicketValidator([
          validateExactly(ticket, 'Does not match expected master ticket.'),
        ]),
      }),
    [ticket]
  );

  const goExecute = useCallback(() => push(names.EXECUTE), [push, names]);

  return (
    <Grid gap={4} className="mt4">
      <Grid.Item full as={Text}>
        Verify New Master Ticket
      </Grid.Item>
      <BridgeForm
        validate={validate}
        onSubmit={goExecute}
        initialVaues={{
          ticket: STUB_VERIFY_TICKET ? ticket : 'undefined',
        }}>
        {({ handleSubmit }) => (
          <>
            <Grid.Item
              full
              as={TicketInput}
              name="ticket"
              label="New master ticket"
            />
            <Grid.Item full as={SubmitButton} handleSubmit={handleSubmit}>
              Verify & Reticket
            </Grid.Item>
          </>
        )}
      </BridgeForm>
    </Grid>
  );
}
