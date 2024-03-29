import * as ob from 'urbit-ob';

export const generateUrl = (ticket: string, planet: number) => {
  if (ticket && planet) {
    return `${window.location.origin}/#${ticket.slice(1)}-${ob
      .patp(planet)
      .slice(1)}`;
  } else if (planet) {
    return ob.patp(planet);
  }

  return 'No Ticket or Ship';
};

export const generateUrlAbbreviation = (ticket: string, planet: number) => {
  if (ticket && planet) {
    return `${window.location.origin}/#${ticket.slice(1, 7)}...${ob
      .patp(planet)
      .slice(1)}`;
  } else if (planet) {
    return ob.patp(planet);
  }

  return 'No Ticket or Ship';
};

export const generateCsvLine = (ind: number, ticket: string, planet: number) =>
  `${ind + 1},${ob.patp(planet)},${generateUrl(
    ticket,
    planet
  )},${planet},${ticket}\n`;

export const generateCsvName = (defaultName: string, patp: string) =>
  `${patp}_${defaultName}`;
