import React, { useCallback, useMemo } from 'react';
import { Input } from 'indigo-react';

import View from 'components/View';
import { useTicketInput } from 'components/Inputs';
import { ForwardButton } from 'components/Buttons';

import { useLocalRouter } from 'lib/LocalRouter';
import { validateExactly } from 'lib/validators';

const STUB_VERIFY_TICKET = process.env.NODE_ENV === 'development';

//TODO deduplicate with PassportVerify
export default function Verify({ newWallet }) {
  const { push, names } = useLocalRouter();

  const ticket = newWallet.value.wallet.ticket;
  const validators = useMemo(
    () => [validateExactly(ticket, 'Does not match expected master ticket.')],
    [ticket]
  );
  const ticketInput = useTicketInput({
    name: 'ticket',
    label: 'New master ticket',
    initialValue: STUB_VERIFY_TICKET ? ticket : undefined,
    autoFocus: true,
    validators,
  });
  const { pass } = ticketInput;

  const next = useCallback(() => push(names.RETICKET), [push, names]);

  return (
    <View>
      Prove that you downloaded the new secrets!
      <Input {...ticketInput} />
      <ForwardButton disabled={!pass} onClick={next}>
        Reticket
      </ForwardButton>
    </View>
  );
}
