import ob from 'urbit-ob';

import { ensurePatFormat } from 'form/formatters';

// looks into the window context to find a "flow command", an object indicating
// if bridge is to be used for one specific flow.
// expects to find objects of the following shape, varying by kind:
//
// { kind: 'invite',
//   as: '~ship',        // who to send the invite as
//   ship: '~ship',      // what planet to send as the invite
//   email: 'ex@amp.le'  // email to send the invite code to
// }
//
// you may optionally include .success() and .failure(reason) callbacks.

const COMMANDS = {
  INVITE: 'invite',
};

const useFlowCommand = () => {
  let flow = window.flow;

  if (typeof flow === 'object') {
    flow.success = flow.success || (() => {});
    flow.failure = flow.failure || (() => {});
    switch (flow.kind) {
      case COMMANDS.INVITE:
        flow.as = ensurePatFormat(flow.as);
        flow.ship = ensurePatFormat(flow.ship);
        if (!ob.isValidPatp(flow.as) || !ob.isValidPatp(flow.ship)) {
          console.log('invalid inviting flow arguments', flow.as, flow.ship);
          flow = null;
        }
        break;
      //
      default:
        console.log('unrecognized kind of flow:', flow.kind);
        flow = null;
        break;
    }
  } else {
    flow = null;
  }

  return flow;
};

export { COMMANDS, useFlowCommand };
