import { useCallback, useEffect } from 'react';
import Maybe from 'folktale/maybe';

import { hasReceived, sendMail } from './inviteMail';
import useSetState from './useSetState';

function useHasReceivedCache(emails = []) {
  const [cache, addToCache] = useSetState();

  const getHasRecieved = useCallback(
    email => cache[email] || Maybe.Nothing(), //
    [cache]
  );

  useEffect(() => {
    for (const email of emails) {
      if (Maybe.Just.hasInstance(getHasRecieved(email))) {
        // never update the cache after we know about it
        return;
      }

      (async () => {
        addToCache({ [email]: await hasReceived(email) });
      })();
    }
  }, [emails, getHasRecieved, addToCache]);

  return { getHasRecieved };
}

export default function useMailer(emails) {
  const { getHasRecieved } = useHasReceivedCache(emails);

  // prefix to avoid clobbering sendMail import
  const _sendMail = useCallback(async (email, ticket, rawTx) => {
    const mailSuccess = await sendMail(email, ticket, rawTx);

    if (!mailSuccess) {
      throw new Error(`Internal mailing error when mailing ${email}`);
    }
  }, []);

  return { getHasRecieved, sendMail: _sendMail };
}
