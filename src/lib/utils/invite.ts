import * as ob from 'urbit-ob';

export const generateUrl = (ticket: string, planet: number) => {
  if (ticket && planet) {
    return `urb.it/#${ticket.slice(1)}-${ob.patp(planet).slice(1)}`;
  } else if (planet) {
    return ob.patp(planet);
  }

  return 'No Ticket or Ship';
};

export const generateCsvLine = (ticket: string, planet: number) =>
  `${ob.patp(planet)},${generateUrl(ticket, planet)}\n`;

export const generateCsvName = (defaultName: string, point: number) =>
  `${ob.patp(point).slice(1)}_${defaultName}`;
