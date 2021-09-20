import { L2Point } from '@urbit/roller-api';
import { azimuth } from 'azimuth-js';

export const isStar = (point: number) =>
  azimuth.getPointSize(point) === azimuth.PointSize.Star;

export const isPlanet = (point: number) =>
  azimuth.getPointSize(point) === azimuth.PointSize.Planet;

export const getProxyAndNonce = (
  point: L2Point,
  address: string
): { proxy?: string; nonce?: number } =>
  point.ownership?.managementProxy?.address === address
    ? { proxy: 'manage', nonce: point.ownership?.managementProxy.nonce }
    : point.ownership?.owner?.address === address
    ? { proxy: 'own', nonce: point.ownership?.owner.nonce }
    : point.ownership?.spawnProxy?.address === address
    ? { proxy: 'spawn', nonce: point.ownership?.spawn?.owner.nonce }
    : point.ownership?.votingProxy?.address === address
    ? { proxy: 'vote', nonce: point.ownership?.votingProxy?.owner.nonce }
    : point.ownership?.transferProxy?.address === address
    ? {
        proxy: 'transfer',
        nonce: point.transferProxy?.votingProxy?.owner.nonce,
      }
    : { proxy: undefined, nonce: undefined };
