export const generateUrl = (ticket: string, planet: string) => {
  if (ticket && planet) {
    return `urb.it/#${ticket.slice(1)}-${planet.slice(1)}`;
  }

  return 'No Ticket or Ship';
};
