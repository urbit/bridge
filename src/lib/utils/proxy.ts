import { Ownership } from '@urbit/roller-api';

export const getProxy = (
  owner: Ownership,
  address: string
): string | undefined =>
  owner.managementProxy?.address === address
    ? 'manage'
    : owner.owner?.address === address
    ? 'own'
    : owner.spawnProxy?.address === address
    ? 'spawn'
    : owner.votingProxy?.address === address
    ? 'vote'
    : owner.transferProxy?.address === address
    ? 'transfer'
    : undefined;
