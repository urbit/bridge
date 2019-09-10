import ob from 'urbit-ob';

import { ensurePatFormat } from 'form/formatters';

/**
 * pull the suggested ticket from the #hash in the url
 */
export default function useImpliedTicket() {
  const hash = window.location.hash.slice(1);
  const ticket = ensurePatFormat(hash);
  const isValid = ob.isValidPatq(ticket);

  return isValid ? ticket : null;
}
