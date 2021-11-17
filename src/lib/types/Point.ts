import * as ob from 'urbit-ob';
import { isGalaxy, isPlanet, isStar } from 'lib/utils/point';
import { eqAddr, isZeroAddress } from 'lib/utils/address';
import { L1Point } from './L1Point';

export interface Points {
  [key: number]: Point;
}

export enum Relationship {
  own,
  transfer,
  manage,
  vote,
  spawn,
}

export default class Point {
  value: number;
  patp: string;
  layer: 1 | 2;
  active: boolean;
  authenticationKey: string;
  continuityNumber: string;
  cryptoSuiteVersion: string;
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
  relationship: Relationship;
  // Derived details
  isL2: boolean;
  isL2Spawn: boolean;
  isL1: boolean;
  isGalaxy: boolean;
  isStar: boolean;
  isPlanet: boolean;
  isParent: boolean;
  canMigrate: boolean;
  networkKeysSet: boolean;
  // usePermissionsForPoint details
  isOwner: boolean;
  isActiveOwner: boolean;
  isManagementProxy: boolean;
  isSpawnProxy: boolean;
  isVotingProxy: boolean;
  isTransferProxy: boolean;
  isManagementProxySet: boolean;
  isSpawnProxySet: boolean;
  isVotingProxySet: boolean;
  isTransferProxySet: boolean;
  canManage: boolean;
  canSpawn: boolean;
  canTransfer: boolean;
  canVote: boolean;
  showInvites: boolean;

  constructor(
    value: number,
    relationship: Relationship,
    details: L1Point,
    address: string
  ) {
    this.value = value;
    this.patp = value < 0 ? 'null' : ob.patp(value);
    this.relationship = relationship;

    this.layer = details.layer;
    this.isL2Spawn = Boolean(details.isL2Spawn);
    this.active = details.active;
    this.authenticationKey = details.authenticationKey;
    this.continuityNumber = details.continuityNumber;
    this.cryptoSuiteVersion = details.cryptoSuiteVersion;
    this.encryptionKey = details.encryptionKey;
    this.escapeRequested = details.escapeRequested;
    this.escapeRequestedTo = details.escapeRequestedTo;
    this.hasSponsor = details.hasSponsor;
    this.keyRevisionNumber = details.keyRevisionNumber;
    this.managementProxy = details.managementProxy;
    this.owner = details.owner;
    this.spawnProxy = details.spawnProxy;
    this.sponsor = details.sponsor;
    this.transferProxy = details.transferProxy;
    this.votingProxy = details.votingProxy;
    // Derived details here
    this.isL2 = this.layer === 2;
    this.isL1 = this.layer === 1;
    this.isGalaxy = isGalaxy(value);
    this.isStar = isStar(value);
    this.isPlanet = isPlanet(value);
    this.isParent = !this.isPlanet;
    this.networkKeysSet = Number(this.keyRevisionNumber) > 0;
    // usePermissionsForPoint
    this.isOwner = eqAddr(address, this.owner);
    this.isActiveOwner = this.isOwner && this.active;
    this.isManagementProxy = eqAddr(address, this.managementProxy);
    this.isSpawnProxy = eqAddr(address, this.spawnProxy);
    this.isVotingProxy = eqAddr(address, this.votingProxy);
    this.isTransferProxy = eqAddr(address, this.transferProxy);
    this.isManagementProxySet = !isZeroAddress(this.managementProxy);
    this.isSpawnProxySet = !isZeroAddress(this.spawnProxy);
    this.isVotingProxySet = !isZeroAddress(this.votingProxy);
    this.isTransferProxySet = !isZeroAddress(this.transferProxy);
    this.canManage = this.isOwner || this.isManagementProxy;
    this.canTransfer = this.isOwner || this.isTransferProxy;
    this.canSpawn =
      this.isParent &&
      (this.isOwner || this.isSpawnProxy) &&
      this.networkKeysSet;
    this.canVote =
      this.isGalaxy && this.active && (this.isOwner || this.isVotingProxy);
    this.canMigrate =
      this.canManage &&
      this.isL1 &&
      ((this.isGalaxy && !this.isL2Spawn) || this.isStar || this.isPlanet);
    this.showInvites = this.canManage || this.canSpawn;
  }
}
