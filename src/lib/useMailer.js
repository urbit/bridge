import { useCallback, useRef } from 'react';

import { hasReceived, sendMail } from './inviteMail';
import timeout from './timeout';

const STUB_MAILER = process.env.REACT_APP_STUB_MAILER === 'true';

export default function useMailer() {
  const cache = useRef({});

  const getHasReceived = useCallback(
    async email => {
      if (!cache.current[email]) {
        if (STUB_MAILER) {
          await timeout(350); // simulate request
          cache.current[email] = false;
        } else {
          cache.current[email] = await hasReceived(email);
        }
      }

      return cache.current[email];
    },
    [cache]
  );

  // prefix to avoid clobbering sendMail import
  // also throws if return value is false
  const _sendMail = useCallback(
    async (email, ticket, sender, message, rawTx) => {
      if (STUB_MAILER) {
        console.log(`${email} - ${ticket}`);
        await timeout(Math.random() * 1000); // simulate request with randomness
        return true;
      }

      const success = await sendMail(email, ticket, sender, message, rawTx);
      if (!success) {
        throw new Error('Failed to send mail');
      }
    },
    []
  );

  return { getHasReceived, sendMail: _sendMail };
}
