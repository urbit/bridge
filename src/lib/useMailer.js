import { useCallback, useRef } from 'react';

import { hasReceived, sendMail } from './inviteMail';

const STUB_MAILER = process.env.REACT_APP_STUB_MAILER === 'true';

export default function useMailer(emails) {
  const cache = useRef({});

  const getHasReceived = useCallback(
    async email => {
      if (!cache.current[email]) {
        if (STUB_MAILER) {
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
  const _sendMail = useCallback(async (email, ticket, sender, rawTx) => {
    if (STUB_MAILER) {
      console.log(`${email} - ${ticket}`);
      return true;
    }

    const success = await sendMail(email, ticket, sender, rawTx);
    if (!success) {
      throw new Error('Failed to send mail');
    }
  }, []);

  return { getHasReceived, sendMail: _sendMail };
}
