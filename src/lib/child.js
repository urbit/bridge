const MIN_GALAXY = 0;
const MIN_STAR = Math.pow(2, 8);
const MIN_PLANET = Math.pow(2, 16);
const MAX_GALAXY = MIN_STAR - 1;
const MAX_STAR = MIN_PLANET - 1;

const randomStarName = galaxy =>
  // (           random in range 0x1 .. 0xff ) * 0x100    + 0x??
  (Math.floor(Math.random() * MAX_GALAXY) + 1) * MIN_STAR + galaxy;

const randomPlanetName = star =>
  // (       random in range 0x1 .. 0xffff ) * 0x10000    + 0x????
  (Math.floor(Math.random() * MAX_STAR) + 1) * MIN_PLANET + star;

const getSpawnCandidate = point =>
  point >= MIN_GALAXY && point < MIN_STAR
    ? randomStarName(point)
    : randomPlanetName(point);

export { getSpawnCandidate };
