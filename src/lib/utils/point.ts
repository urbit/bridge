import { L2Point } from '@urbit/roller-api';
import { azimuth } from 'azimuth-js';
import { L1Point } from 'lib/types/L1Point';

export const isGalaxy = (point: number) =>
  azimuth.getPointSize(point) === azimuth.PointSize.Galaxy;

export const isStar = (point: number) =>
  azimuth.getPointSize(point) === azimuth.PointSize.Star;

export const isPlanet = (point: number) =>
  azimuth.getPointSize(point) === azimuth.PointSize.Planet;

export const toL1Details = (point: L2Point): L1Point => {
  return {
    layer: point?.dominion === 'l2' ? 2 : 1,
    isL2Spawn: point.dominion === 'spawn' || point.dominion === 'l2',
    active: true,
    authenticationKey: point?.network?.keys?.auth,
    continuityNumber: point?.network?.rift,
    cryptoSuiteVersion: point?.network?.keys?.suite,
    encryptionKey: point?.network?.keys?.crypt,
    escapeRequested: point?.network?.escape ? true : false,
    escapeRequestedTo: point?.network?.escape,
    hasSponsor: point?.network?.sponsor?.has,
    keyRevisionNumber: point?.network?.keys?.life,
    managementProxy: point?.ownership?.managementProxy?.address!,
    owner: point?.ownership?.owner?.address!,
    spawnProxy: point?.ownership?.spawnProxy?.address!,
    sponsor: point?.network?.sponsor?.who,
    transferProxy: point?.ownership?.transferProxy?.address!,
    votingProxy: point?.ownership?.votingProxy?.address!,
  };
};
