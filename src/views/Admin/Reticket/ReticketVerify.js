import React, { useCallback, useMemo } from 'react';
import { Text, Grid, CheckboxInput } from 'indigo-react';

import { useLocalRouter } from 'lib/LocalRouter';
import { validateExactly } from 'lib/validators';
import { isDevelopment } from 'lib/flags';

import BridgeForm from 'form/BridgeForm';
import { TicketInput } from 'form/Inputs';
import { composeValidator, buildPatqValidator } from 'form/validators';
import SubmitButton from 'form/SubmitButton';
import FormError from 'form/FormError';

const STUB_VERIFY_TICKET = isDevelopment;

export default function ReticketVerify({ newWallet }) {
  const { push, names } = useLocalRouter();

  const ticket = newWallet.value.wallet.ticket;
  const validate = useMemo(
    () =>
      composeValidator({
        ticket: buildPatqValidator([
          validateExactly(ticket, 'Does not match expected master ticket.'),
        ]),
      }),
    [ticket]
  );

  const initialValues = useMemo(
    () => ({
      ticket: STUB_VERIFY_TICKET ? ticket : 'undefined',
    }),
    [ticket]
  );

  const goExecute = useCallback(() => push(names.EXECUTE), [push, names]);

  return (
    <Grid className="mt4">
      <Grid.Item full as={Text}>
        Verify New Master Ticket
      </Grid.Item>
      <BridgeForm
        validate={validate}
        afterSubmit={goExecute}
        initialValues={initialValues}>
        {({ handleSubmit, values }) => (
          <>
            <Grid.Item
              full
              as={TicketInput}
              className="mt4"
              type={values.showTicket ? 'text' : 'password'}
              name="ticket"
              label="New master ticket"
            />

            <Grid.Item full as={CheckboxInput} name="showTicket" label="Show" />

            <Grid.Item full as={FormError} />

            <Grid.Item full as={SubmitButton} handleSubmit={handleSubmit}>
              Verify & Reticket
            </Grid.Item>
          </>
        )}
      </BridgeForm>
    </Grid>
  );
}
