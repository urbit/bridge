import { Ownership } from '@urbit/roller-api';

// TODO: test when all proxies are configured to the same address
export const getProxy = (
  owner: Ownership,
  address: string
): string | undefined =>
  owner.owner?.address === address
    ? 'own'
    : owner.managementProxy?.address === address
    ? 'manage'
    : owner.spawnProxy?.address === address
    ? 'spawn'
    : owner.votingProxy?.address === address
    ? 'vote'
    : owner.transferProxy?.address === address
    ? 'transfer'
    : undefined;

export const isManagementProxy = (owner: Ownership, address: string) =>
  owner.managementProxy?.address === address;

export const isTransferProxy = (owner: Ownership, address: string) =>
  owner.transferProxy?.address === address;

export const isVotingProxy = (owner: Ownership, address: string) =>
  owner.votingProxy?.address === address;

export const isSpawnProxy = (owner: Ownership, address: string) =>
  owner.spawnProxy?.address === address;

export const isOwnerProxy = (owner: Ownership, address: string) =>
  owner.owner?.address === address;
