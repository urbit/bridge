import * as ob from 'urbit-ob';

import { prependSig } from './transformers';

/**
 * pull the suggested point from the subdomain
 */
export default function useImpliedPoint() {
  const subdomain = window.location.host.split('.')[0];
  const patp = prependSig(subdomain);
  const isValid = ob.isValidPatp(patp);

  return isValid ? patp : null;
}
