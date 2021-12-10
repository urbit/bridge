import { L1TxnType } from './types/PendingL1Transaction';

export const PROXY_TYPE = {
  MANAGEMENT: 'MANAGEMENT',
  SPAWN: 'SPAWN',
  TRANSFER: 'TRANSFER',
  VOTING: 'VOTING',
};

export const proxyTypeToHuman = proxyType => {
  switch (proxyType) {
    case PROXY_TYPE.MANAGEMENT:
      return 'management';
    case PROXY_TYPE.SPAWN:
      return 'spawn';
    case PROXY_TYPE.TRANSFER:
      return 'transfer';
    case PROXY_TYPE.VOTING:
      return 'voting';
    default:
      throw new Error(`Unknown proxyType: ${proxyType}`);
  }
};

export const proxyTypeToL1TxnType = proxyType => {
  switch (proxyType) {
    case PROXY_TYPE.MANAGEMENT:
      return L1TxnType.managementProxy;
    case PROXY_TYPE.SPAWN:
      return L1TxnType.spawnProxy;
    case PROXY_TYPE.TRANSFER:
      return L1TxnType.transferProxy;
    case PROXY_TYPE.VOTING:
      return L1TxnType.votingProxy;
    default:
      throw new Error(`Unknown proxyType: ${proxyType}`);
  }
};

export const proxyTypeToHumanDescription = proxyType => {
  switch (proxyType) {
    case PROXY_TYPE.MANAGEMENT:
      return 'Your management key can configure networking settings (network keys and sponsorship).';
    case PROXY_TYPE.SPAWN:
      return 'Your spawn key can spawn points on your behalf.';
    case PROXY_TYPE.TRANSFER:
      return 'Your transfer key can transfer this point.';
    case PROXY_TYPE.VOTING:
      return "Your voting key can vote on this point's behalf.";
    default:
      throw new Error(`Unknown proxyType: ${proxyType}`);
  }
};
