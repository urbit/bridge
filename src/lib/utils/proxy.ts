import { Ownership, Proxy } from '@urbit/roller-api';

const isManagementProxy = (owner: Ownership, address: string) =>
  owner.managementProxy?.address === address;

const isTransferProxy = (owner: Ownership, address: string) =>
  owner.transferProxy?.address === address;

const isSpawnProxy = (owner: Ownership, address: string) =>
  owner.spawnProxy?.address === address;

const isOwnerProxy = (owner: Ownership, address: string) =>
  owner.owner?.address === address;

export const getSpawnProxy = (owner: Ownership, address: string) =>
  isOwnerProxy(owner, address)
    ? 'own'
    : isSpawnProxy(owner, address)
    ? 'spawn'
    : undefined;

export const getManagerProxy = (owner: Ownership, address: string) =>
  isOwnerProxy(owner, address)
    ? 'own'
    : isManagementProxy(owner, address)
    ? 'manage'
    : undefined;

export const getAddressProxy = (
  owner: Ownership,
  address: string,
  proxyType: Proxy
) =>
  isOwnerProxy(owner, address)
    ? 'own'
    : proxyType === 'manage' && isManagementProxy(owner, address)
    ? 'manage'
    : proxyType === 'spawn' && isSpawnProxy(owner, address)
    ? 'spawn'
    : proxyType === 'transfer' && isTransferProxy(owner, address)
    ? 'transfer'
    : undefined;

export const getTransferProxy = (owner: Ownership, address: string) =>
  isOwnerProxy(owner, address)
    ? 'own'
    : isTransferProxy(owner, address)
    ? 'transfer'
    : undefined;
