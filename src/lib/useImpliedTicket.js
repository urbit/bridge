import * as ob from 'urbit-ob';

import { prependSig } from './transformers';

/**
 * pull the suggested ticket from the #hash in the url
 */
export default function useImpliedTicket() {
  const hash = window.location.hash.slice(1);
  const tick = prependSig(hash);
  const isValid = ob.isValidPatq(tick);

  return isValid ? tick : null;
}
