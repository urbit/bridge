import * as ob from 'urbit-ob';
import { isGalaxy, isPlanet, isStar } from 'lib/utils/point';
import { eqAddr, isZeroAddress } from 'lib/utils/address';
import { L1Point } from './L1Point';
import { Proxy } from '@urbit/roller-api';
import { DUMMY_L2_ADDRESS } from 'lib/constants';

export interface Points {
  [key: number]: Point;
}

export enum PointField {
  value = 'value',
  layer = 'layer',
  active = 'active',
  authenticationKey = 'authenticationKey',
  continuityNumber = 'continuityNumber',
  cryptoSuiteVersion = 'cryptoSuiteVersion',
  encryptionKey = 'encryptionKey',
  escapeRequested = 'escapeRequested',
  escapeRequestedTo = 'escapeRequestedTo',
  hasSponsor = 'hasSponsor',
  keyRevisionNumber = 'keyRevisionNumber',
  managementProxy = 'managementProxy',
  owner = 'owner',
  spawnProxy = 'spawnProxy',
  sponsor = 'sponsor',
  transferProxy = 'transferProxy',
  votingProxy = 'votingProxy',
  isL2 = 'isL2',
  isL2Spawn = 'isL2Spawn',
  isL1 = 'isL1',
  isGalaxy = 'isGalaxy',
  isStar = 'isStar',
  isPlanet = 'isPlanet',
  isParent = 'isParent',
  canMigrate = 'canMigrate',
  networkKeysSet = 'networkKeysSet',
  isOwner = 'isOwner',
  isActiveOwner = 'isActiveOwner',
  isManagementProxy = 'isManagementProxy',
  isSpawnProxy = 'isSpawnProxy',
  isVotingProxy = 'isVotingProxy',
  isTransferProxy = 'isTransferProxy',
  isManagementProxySet = 'isManagementProxySet',
  isSpawnProxySet = 'isSpawnProxySet',
  isVotingProxySet = 'isVotingProxySet',
  isTransferProxySet = 'isTransferProxySet',
  canManage = 'canManage',
  canSpawn = 'canSpawn',
  canTransfer = 'canTransfer',
  canVote = 'canVote',
  showInvites = 'showInvites',
}

interface PointConstructorParams {
  value: number;
  details: L1Point;
  address: string;
  l2Quota?: number;
  isPlaceholder?: boolean;
}

export default class Point {
  value: number;
  patp: string;
  layer: 1 | 2;
  l2Quota: number;
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
  couldSpawn: boolean;
  canSpawn: boolean;
  canTransfer: boolean;
  canVote: boolean;
  showInvites: boolean;
  isDefault: boolean;
  isPlaceholder: boolean;
  ownManageSpawn: boolean;
  shouldDisplay: boolean;
  isOutgoing: boolean;

  constructor({
    value,
    details,
    address,
    l2Quota = 0,
    isPlaceholder = false,
  }: PointConstructorParams) {
    this.value = value;
    this.patp = value < 0 ? 'null' : ob.patp(value);

    this.layer = details.layer || 1;
    this.l2Quota = l2Quota;
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
    this.couldSpawn = this.isParent && (this.isOwner || this.isSpawnProxy);
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
    this.isDefault = value === -1;
    this.isPlaceholder = isPlaceholder;
    this.ownManageSpawn =
      !this.isPlaceholder &&
      !this.isDefault &&
      (this.isOwner || this.isSpawnProxy || this.isManagementProxy);
    this.shouldDisplay = this.ownManageSpawn || this.isTransferProxy;
    this.isOutgoing =
      this.isTransferProxySet &&
      !this.isTransferProxy &&
      this.canManage &&
      this.transferProxy !== DUMMY_L2_ADDRESS;
  }

  equals = (point: Point) => {
    return Object.values(PointField).reduce(
      (acc, field) => acc && this[field] === point[field],
      true
    );
  };

  getChangedField = (point: Point, targetField?: PointField) =>
    targetField
      ? this[targetField] !== point[targetField] && targetField
      : Object.values(PointField).find(field => this[field] !== point[field]);

  getAddressProxy = (proxyType: Proxy) =>
    this.isOwner
      ? 'own'
      : proxyType === 'manage' && this.isManagementProxy
      ? 'manage'
      : proxyType === 'spawn' && this.isSpawnProxy
      ? 'spawn'
      : proxyType === 'transfer' && this.isTransferProxy
      ? 'transfer'
      : undefined;

  getManagerProxy = () =>
    this.isOwner ? 'own' : this.isManagementProxy ? 'manage' : undefined;

  getSpawnProxy = () =>
    this.isOwner ? 'own' : this.isSpawnProxy ? 'spawn' : undefined;

  getTransferProxy = () =>
    this.isOwner ? 'own' : this.isTransferProxy ? 'transfer' : undefined;
}
