import { useCallback } from 'react';
import Maybe from 'folktale/maybe';

import { hasReceived, sendMail } from './inviteMail';
import useSetState from './useSetState';

const kStubMailer = process.env.REACT_APP_STUB_MAILER === 'true';

function useHasReceivedCache() {
  const [cache, addToCache] = useSetState();

  const getHasRecieved = useCallback(
    email => cache[email] || Maybe.Nothing(), //
    [cache]
  );

  const syncHasReceivedForEmail = useCallback(
    async email => {
      if (Maybe.Just.hasInstance(getHasRecieved(email))) {
        // never update the cache after we know about it
        return;
      }

      if (kStubMailer) {
        // always allow sending emails when stubbing
        return addToCache({ [email]: Maybe.Just(false) });
      }

      const _hasReceived = await hasReceived(email);
      addToCache({ [email]: Maybe.Just(_hasReceived) });
    },
    [getHasRecieved, addToCache]
  );

  return { getHasRecieved, syncHasReceivedForEmail };
}

export default function useMailer(emails) {
  const hasReceivedCache = useHasReceivedCache(emails);

  // prefix to avoid clobbering sendMail import
  // also throws if return value is false
  const _sendMail = useCallback(async (email, ticket, rawTx) => {
    if (kStubMailer) {
      console.log(`${email} - ${ticket}`);
      return;
    }

    const mailSuccess = await sendMail(email, ticket, rawTx);

    if (!mailSuccess) {
      throw new Error(`Internal mailing error when mailing ${email}`);
    }
  }, []);

  return { ...hasReceivedCache, sendMail: _sendMail };
}
