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

export const proxyTypeToHumanDescription = proxyType => {
  switch (proxyType) {
    case PROXY_TYPE.MANAGEMENT:
      return 'Your management key can configure networking settings (network keys and sponsorship)';
    case PROXY_TYPE.SPAWN:
      return 'Your spawn key can spawn points.';
    case PROXY_TYPE.TRANSFER:
      return 'Your transfer key can transfer this point.';
    case PROXY_TYPE.VOTING:
      return "Your voting key can vote on this point's behalf.";
    default:
      throw new Error(`Unknown proxyType: ${proxyType}`);
  }
};
