import { useMemo } from 'react';
import { isValidAddress } from './wallet';

// looks into the GET parameters and attempts to construct a "flow" object,
// which would indicate bridge is to be used for one specific flow.
// expects to find any of the following sets of parameters, varying by kind.
//
// ? kind  = invite
// & as    = ~ship      // who to send the invite as
// & ship  = ~ship      // what planet to send as the invite
// & email = ex@amp.le  // email to send the invite code to
//
// ? kind = takeLockup
// & lock = linear | conditional  // which lockup contract, defaults to linear
// & from = 0x1234abcd            // ethereum address to accept transfer from
//

const COMMANDS = {
  TAKE_LOCKUP: 'takeLockup',
};

const useFlowCommand = () => {
  const flow = useMemo(() => {
    let flow = {};

    window.location.search
      .substr(1)
      .split('&')
      .forEach(arg => {
        if ('' === arg) return;
        const pam = arg.split('=');
        flow[pam[0]] = pam.length <= 1 ? true : decodeURIComponent(pam[1]);
      });

    if (typeof flow === 'object') {
      switch (flow.kind) {
        case COMMANDS.TAKE_LOCKUP:
          flow.lock = flow.lock || 'linear';
          if (
            (flow.lock !== 'linear' && flow.lock !== 'conditional') ||
            !isValidAddress(flow.from)
          ) {
            flow = null;
          }
          break;
        //
        default:
          console.log('unrecognized kind of flow:', flow.kind);
        // eslint-disable-next-line no-fallthrough
        case undefined:
          flow = null;
          break;
      }
    } else {
      flow = null;
    }

    return flow;
  }, []);

  return flow;
};

export { COMMANDS, useFlowCommand };
