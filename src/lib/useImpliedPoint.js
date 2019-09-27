import ob from 'urbit-ob';

import { ensurePatFormat } from 'form/formatters';

/**
 * pull the suggested point from the subdomain
 */
export default function useImpliedPoint() {
  const subdomain = window.location.host.split('.')[0];
  const patp = ensurePatFormat(subdomain);
  const isValid = ob.isValidPatp(patp);

  return isValid ? patp : null;
}
