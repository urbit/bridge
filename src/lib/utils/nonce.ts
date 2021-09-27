import { Ownership } from '@urbit/roller-api';

export const getProxyAndNonce = (
  owner: Ownership,
  address: string
): { proxy?: string; nonce?: number } =>
  owner.managementProxy?.address === address
    ? { proxy: 'manage', nonce: owner.managementProxy.nonce }
    : owner.owner?.address === address
    ? { proxy: 'own', nonce: owner.owner.nonce }
    : owner.spawnProxy?.address === address
    ? { proxy: 'spawn', nonce: owner.spawn?.owner.nonce }
    : owner.votingProxy?.address === address
    ? { proxy: 'vote', nonce: owner.votingProxy?.owner.nonce }
    : owner.transferProxy?.address === address
    ? {
        proxy: 'transfer',
        nonce: owner.votingProxy?.nonce,
      }
    : { proxy: undefined, nonce: undefined };

export const getManagementNonce = (
  owner: Ownership,
  address: string
): { nonce?: number; proxy?: string } | undefined =>
  owner.managementProxy?.address === address
    ? { nonce: owner.managementProxy.nonce, proxy: 'manage' }
    : undefined;

export const getTransferNonce = (
  owner: Ownership,
  address: string
): { nonce?: number; proxy?: string } | undefined =>
  owner.transferProxy?.address === address
    ? { nonce: owner.transferProxy.nonce, proxy: 'transfer' }
    : undefined;

export const getOwnerNonce = (
  owner: Ownership,
  address: string
): { nonce?: number; proxy?: string } | undefined =>
  owner.owner?.address === address
    ? { nonce: owner.owner.nonce, proxy: 'own' }
    : undefined;

export const getSpawnNonce = (
  owner: Ownership,
  address: string
): { nonce?: number; proxy?: string } | undefined =>
  owner.spawnProxy?.address === address
    ? { nonce: owner.spawnProxy.nonce, proxy: 'spawn' }
    : undefined;

export const getVotingNonce = (
  owner: Ownership,
  address: string
): { nonce?: number; proxy?: string } | undefined =>
  owner.votingProxy?.address === address
    ? { nonce: owner.votingProxy.nonce, proxy: 'vote' }
    : undefined;

export const increaseProxyNonce = (
  owner: Ownership,
  proxy: string
): Ownership | undefined =>
  'manage' === proxy
    ? {
        ...owner,
        managementProxy: {
          ...owner.managementProxy,
          nonce: owner.managementProxy?.nonce
            ? owner.managementProxy?.nonce + 1
            : 1,
        },
      }
    : 'own' === proxy
    ? {
        ...owner,
        owner: {
          ...owner.owner,
          nonce: owner.owner?.nonce ? owner.owner?.nonce + 1 : 1,
        },
      }
    : 'spawn' === proxy
    ? {
        ...owner,
        spawnProxy: {
          ...owner.spawnProxy,
          nonce: owner.spawnProxy?.nonce ? owner.spawnProxy?.nonce + 1 : 1,
        },
      }
    : 'vote' === proxy
    ? {
        ...owner,
        votingProxy: {
          ...owner.votingProxy,
          nonce: owner.votingProxy?.nonce ? owner.votingProxy?.nonce + 1 : 1,
        },
      }
    : 'transfer' === proxy
    ? {
        ...owner,
        transferProxy: {
          ...owner.transferProxy,
          nonce: owner.transferProxy?.nonce
            ? owner.transferProxy?.nonce + 1
            : 1,
        },
      }
    : undefined;

export const setProxyNonce = (
  owner: Ownership,
  proxy: string,
  nonce: number
): Ownership | undefined =>
  'manage' === proxy
    ? {
        ...owner,
        managementProxy: {
          ...owner.managementProxy,
          nonce,
        },
      }
    : 'own' === proxy
    ? {
        ...owner,
        owner: {
          ...owner.owner,
          nonce,
        },
      }
    : 'spawn' === proxy
    ? {
        ...owner,
        spawnProxy: {
          ...owner.spawnProxy,
          nonce,
        },
      }
    : 'vote' === proxy
    ? {
        ...owner,
        votingProxy: {
          ...owner.voteProxy,
          nonce,
        },
      }
    : 'transfer' === proxy
    ? {
        ...owner,
        transferProxy: {
          ...owner.transferProxy,
          nonce,
        },
      }
    : undefined;
