import * as ob from 'urbit-ob';

export const generateUrl = (ticket: string, planet: number) => {
  if (ticket && planet) {
    return `urb.it/#${ticket.slice(1)}-${ob.patp(planet).slice(1)}`;
  }

  return 'No Ticket or Ship';
};
