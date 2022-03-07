import expiredPlanetsWithInviteCodes from './expiredPlanetsWithInviteCodes.json';
import { deSiggedString } from './lib';

export default function useIsExpired(
  patp: string | null,
  ticket: string | null
) {
  let isExpired = false;

  if (patp !== null && ticket !== null) {
    const ticketPatp = deSiggedString(ticket)?.concat(
      '-',
      deSiggedString(patp)
    );

    const expired = Object.keys(expiredPlanetsWithInviteCodes).includes(
      ticketPatp
    );

    isExpired = expired;
  }

  return {
    isExpired,
  };
}
