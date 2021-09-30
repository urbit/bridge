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
