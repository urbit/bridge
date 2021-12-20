import { useMemo } from 'react';
import { isValidAddress } from './utils/address';

// looks into the GET parameters and attempts to construct a "flow" object,
// which would indicate bridge is to be used for one specific flow.
// expects to find any of the following sets of parameters, varying by kind.
//
// ? kind = takeLockup
// & lock = linear | conditional  // which lockup contract, defaults to linear
// & from = 0x1234abcd            // ethereum address to accept transfer from
//
// ? kind = btc
// & utx  = somebase64string
//
// ? kind = xpub
//

const COMMANDS = {
  TAKE_LOCKUP: 'takeLockup',
  BITCOIN: 'btc',
  XPUB: 'xpub',
};

export type FlowType = { [k: string]: string | boolean } | null;

const useFlowCommand = () => {
  const flow = useMemo(() => {
    let flow: FlowType = {};

    window.location.search
      .substr(1)
      .split('&')
      .forEach(arg => {
        if ('' === arg) return;
        const pam = arg.split('=');
        if (flow) {
          flow[pam[0]] = pam.length <= 1 ? true : decodeURIComponent(pam[1]);
        }
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
        case COMMANDS.BITCOIN:
          try {
            if (flow.utx && typeof flow.utx === 'string') {
              atob(flow.utx);
            } else {
              throw Error();
            }
          } catch (e) {
            flow = null;
          }
          break;
        //
        case COMMANDS.XPUB:
          break;
        //
        case undefined:
          flow = null;
          break;
        default:
          console.log('unrecognized kind of flow:', flow.kind);
          flow = null;
      }
    } else {
      flow = null;
    }

    return flow;
  }, []);

  return flow;
};

export { COMMANDS, useFlowCommand };
