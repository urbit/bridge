import React, { useCallback, useMemo } from 'react';
import { Grid, P } from 'indigo-react';

import * as need from 'lib/need';
import { useLocalRouter } from 'lib/LocalRouter';
import { validateExactly } from 'lib/validators';
import { isDevelopment } from 'lib/flags';

import SubmitButton from 'form/SubmitButton';
import { TicketInput } from 'form/Inputs';
import BridgeForm from 'form/BridgeForm';

import { useActivateFlow } from './ActivateFlow';
import PassportView from './PassportView';

const STUB_VERIFY_TICKET = isDevelopment;

export default function PassportVerify({ className }) {
  const { push, names } = useLocalRouter();
  const { derivedWallet } = useActivateFlow();
  const goToTransfer = useCallback(() => push(names.TRANSFER), [push, names]);

  const { ticket } = need.wallet(derivedWallet);
  const validators = useMemo(
    () => [validateExactly(ticket, 'Does not match expected master ticket.')],
    [ticket]
  );

  const onSubmit = useCallback(() => goToTransfer(), [goToTransfer]);

  return (
    <PassportView header="Verify Passport" step={2} className={className}>
      <Grid>
        <Grid.Item full as={P}>
          After you download your passport, verify your custody. Your passport
          should be a folder of image files. One of them is your Master Ticket.
          Open it and enter the 4 word phrase below (with hyphens).
        </Grid.Item>
        <BridgeForm
          onSubmit={onSubmit}
          initialValues={{
            ticket: STUB_VERIFY_TICKET ? ticket : undefined,
          }}>
          {({ handleSubmit }) => (
            <>
              <Grid.Item
                full
                as={TicketInput}
                name="ticket"
                label="Master Ticket"
                validators={validators}
                autoFocus
              />

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
