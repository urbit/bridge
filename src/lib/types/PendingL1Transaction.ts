export enum L1TxnType {
  migrate = 'migrate',
  migrateSpawn = 'migrateSpawn',
  spawnProxy = 'spawnProxy',
  managementProxy = 'managementProxy',
  transferProxy = 'transferProxy',
  votingProxy = 'votingProxy',
  acceptTransfer = 'acceptTransfer',
  spawnPoint = 'spawnPoint',
  setNetworkKeys = 'setNetworkKeys',
}

export interface PendingL1Txn {
  id: string;
  point: number;
  type: L1TxnType;
  hash: string;
}

export interface PendingL1 {
  [key: number]: PendingL1Txn[];
}
