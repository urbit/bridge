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
      // TODO: is the below copy actually true?
      return "The management address proves your point's identity to Arvo.";
    case PROXY_TYPE.SPAWN:
      return 'The spawn proxy is allowed to spawn points from this point.';
    case PROXY_TYPE.TRANSFER:
      return 'The transfer proxy is allowed to transfer this point.';
    case PROXY_TYPE.VOTING:
      return "The voting proxy is allowed to vote on this point's behalf.";
    default:
      throw new Error(`Unknown proxyType: ${proxyType}`);
  }
};
