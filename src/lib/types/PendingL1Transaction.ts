export enum L1TxnType {
  migrate = 'migrate',
  migrateSpawn = 'migrate-spawn',
  spawnProxy = 'set-spawn-proxy',
  managementProxy = 'set-management-proxy',
  transferProxy = 'set-transfer-proxy',
  votingProxy = 'set-voting-proxy',
  acceptTransfer = 'transfer-point',
  cancelTransfer = 'cancel-transfer',
  spawn = 'spawn',
  setNetworkKeys = 'configure-keys',
}

export interface PendingL1Txn {
  id: string;
  point: number;
  type: L1TxnType;
  hash: string;
  time: number;
}

export interface PendingL1 {
  [key: number]: PendingL1Txn[];
}
