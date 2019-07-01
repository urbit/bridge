import React, { useCallback, useMemo } from 'react';
import { Grid, H4, P, Input, Text } from 'indigo-react';

import * as need from 'lib/need';
import { useLocalRouter } from 'lib/LocalRouter';

import { ForwardButton } from 'components/Buttons';
import Steps from 'components/Steps';
import { useTicketInput } from 'components/Inputs';

import { useActivateFlow } from './ActivateFlow';
import { validateExactly } from 'lib/validators';

const STUB_VERIFY_TICKET = process.env.NODE_ENV === 'development';

export default function PassportVerify({ className }) {
  const { push, names } = useLocalRouter();
  const { derivedWallet } = useActivateFlow();
  const goToTransfer = useCallback(() => push(names.TRANSFER), [push, names]);

  const { ticket } = need.wallet(derivedWallet);
  const validators = useMemo(
    () => [validateExactly(ticket, 'Does not match expected master ticket.')],
    [ticket]
  );
  const ticketInput = useTicketInput({
    name: 'ticket',
    label: 'Master Ticket',
    initialValue: STUB_VERIFY_TICKET ? ticket : undefined,
    autoFocus: true,
    validators,
  });
  const { pass } = ticketInput;

  return (
    <Grid gap={4} className={className}>
      <Grid.Item full as={Steps} num={2} total={3} />
      <Grid.Item full as={H4}>
        Verify Passport
      </Grid.Item>
      <Grid.Item full as={Text} className="f5">
        After you download your passport, verify your custody. Your passport
        should be a folder of image files. One of them is your Master Ticket.
        Open it and enter the 4 word phrase below (with hyphens).
      </Grid.Item>
      <Grid.Item full as={Input} {...ticketInput} />
      <Grid.Item
        full
        as={ForwardButton}
        disabled={!pass}
        onClick={goToTransfer}
        solid>
        Verify
      </Grid.Item>
    </Grid>
  );
}
