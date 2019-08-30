import React, { useCallback, useMemo } from 'react';
import { Grid, P, CheckboxInput } from 'indigo-react';

import * as need from 'lib/need';
import { useLocalRouter } from 'lib/LocalRouter';
import { validateExactly } from 'lib/validators';
import { isDevelopment } from 'lib/flags';

import SubmitButton from 'form/SubmitButton';
import { TicketInput } from 'form/Inputs';
import {
  composeValidator,
  buildPatqValidator,
  buildCheckboxValidator,
} from 'form/validators';
import BridgeForm from 'form/BridgeForm';

import { useActivateFlow } from './ActivateFlow';
import PassportView from './PassportView';
import FormError from 'form/FormError';

const STUB_VERIFY_TICKET = isDevelopment;

export default function PassportVerify({ className }) {
  const { push, names } = useLocalRouter();
  const { derivedWallet } = useActivateFlow();
  const goToTransfer = useCallback(() => push(names.TRANSFER), [push, names]);

  const { ticket } = need.wallet(derivedWallet);
  const validate = useMemo(
    () =>
      composeValidator({
        ticket: buildPatqValidator([
          validateExactly(ticket, 'Does not match expected master ticket.'),
        ]),
        showTicket: buildCheckboxValidator(),
      }),
    [ticket]
  );

  const initialValues = useMemo(
    () => ({
      ticket: STUB_VERIFY_TICKET ? ticket : undefined,
      showTicket: true,
    }),
    [ticket]
  );

  return (
    <PassportView header="Verify Your Master Ticket" step={2} className={className}>
      <Grid>
        <Grid.Item full as={P}>
          We need to verify that you’re you. Now that you’ve downloaded your Passport, open the folder of image files.
        </Grid.Item>
        <Grid.Item full as={P}>
One of the images includes your Master Ticket. It’s a four-word phrase separated with hyphens. Never share your Master Ticket with anyone. Enter it below (with hyphens).
        </Grid.Item>
        <BridgeForm
          validate={validate}
          afterSubmit={goToTransfer}
          initialValues={initialValues}>
          {({ values, handleSubmit }) => (
            <>
              <Grid.Item
                full
                as={TicketInput}
                type={values.showTicket ? 'text' : 'password'}
                name="ticket"
                label="Master Ticket"
              />

              <Grid.Item
                full
                as={CheckboxInput}
                name="showTicket"
                label="Show"
              />

              <Grid.Item full as={FormError} />

              <Grid.Item
                full
                className="mt3"
                as={SubmitButton}
                handleSubmit={handleSubmit}>
                Verify
              </Grid.Item>
            </>
          )}
        </BridgeForm>
      </Grid>
    </PassportView>
  );
}
