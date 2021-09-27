// Response returned by L1's azimuth#getPoint
export type L1Point = {
  active: boolean;
  authenticationKey: string;
  continuityNumber: string;
  cryptoSuiteVersion: string;
  dominion?: string;
  encryptionKey: string;
  escapeRequested: boolean;
  escapeRequestedTo: string;
  hasSponsor: boolean;
  keyRevisionNumber: string;
  managementProxy: string;
  owner: string;
  spawnProxy: string;
  sponsor: string;
  transferProxy: string;
  votingProxy: string;
};
