import * as ob from 'urbit-ob';

import { prependSig } from './transformers';

/**
 * pull the suggested ticket from the #hash in the url
 */
export default function useImpliedTicket() {
  const hash = window.location.hash.slice(1);
  const ticket = prependSig(hash);
  const isValid = ob.isValidPatq(ticket);

  return isValid ? ticket : null;
}
