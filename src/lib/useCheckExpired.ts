import { stripSigPrefix } from 'form/formatters';
import expiredPlanetsWithInviteCodes from './expiredPlanetsWithInviteCodes.json';

export default function useIsExpired(
  patp: string | null,
  ticket: string | null
) {
  let isExpired = false;

  if (patp !== null && ticket !== null) {
    const ticketPatp = stripSigPrefix(ticket).concat('-', stripSigPrefix(patp));

    const expired = Object.keys(expiredPlanetsWithInviteCodes).includes(
      ticketPatp
    );

    isExpired = expired;
  }

  return {
    isExpired,
  };
}
