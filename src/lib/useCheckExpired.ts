import expiredPlanetsByStar from './expiredPlanetsByStar.json';

export default function useIsExpired(patp: string | null) {
  let isExpired = false;
  let expiredPatps: string[] = [];

  for (const [_, value] of Object.entries(expiredPlanetsByStar)) {
    const { planets } = value;

    planets.forEach(planet => expiredPatps.push(planet.patp));
  }

  function patpInExpiredList(patp: string): boolean {
    return expiredPatps.includes(patp);
  }

  if (patp !== null) {
    isExpired = patpInExpiredList(patp);
  }

  return {
    isExpired,
  };
}
