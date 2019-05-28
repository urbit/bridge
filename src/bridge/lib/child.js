const MIN_GALAXY = 0
const MIN_STAR = Math.pow(2, 8)
const MIN_PLANET = Math.pow(2, 16)
const MAX_GALAXY = MIN_STAR - 1
const MAX_STAR = MIN_PLANET - 1

const getNthSpawnCandidate = (point, n) => {
  let childSpace = point >= MIN_GALAXY && point < MIN_STAR ? 0x100 : 0x10000
  return point + ((n + 1) * childSpace)
}

export {
  getNthSpawnCandidate
}
