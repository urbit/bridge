import create from 'zustand';
import {
  L2Point,
  PendingTransaction,
  Ownership,
  Ship,
} from '@urbit/roller-api';

import { HOUR, isL2, isL2Spawn } from 'lib/utils/roller';
import { increaseProxyNonce, setProxyNonce } from 'lib/utils/nonce';
import { Invite } from 'lib/types/Invite';

export interface RollerStore {
  nextBatchTime: number;
  nextRoll: string;
  pendingTransactions: PendingTransaction[];
  currentPoint: L2Point | null;
  currentL2: boolean;
  currentL2Spawn: boolean;
  nonces: {
    [point: Ship]: Ownership;
  };
  increaseNonce: (point: Ship, proxy: string) => void;
  setNonce: (
    point: Ship,
    owner: Ownership,
    proxy: string,
    nonce: number
  ) => void;
  setNonces: (point: number, owner: Ownership) => void;
  invites: Invite[];
  recentlyCompleted: number;
  setNextBatchTime: (nextBatchTime: number) => void;
  setNextRoll: (nextRoll: string) => void;
  setPendingTransactions: (pendingTransactions: PendingTransaction[]) => void;
  setCurrentPoint: (currentPoint: L2Point) => void;
  setInvites: (invites: Invite[]) => void;
}

export const useRollerStore = create<RollerStore>(set => ({
  nextBatchTime: new Date().getTime() + HOUR,
  nextRoll: '0h 00m 00s',
  pendingTransactions: [],
  currentPoint: null,
  currentL2: false,
  currentL2Spawn: false,
  invites: [],
  recentlyCompleted: 0,
  nonces: {},
  increaseNonce: (point: Ship, proxy: string) =>
    set(state => {
      const owner = increaseProxyNonce(state.nonces[point], proxy);
      console.log(point, proxy, owner);
      if (!owner) throw new Error("Can't increase nonce for this proxy");
      return { ...state, nonces: { ...state.nonces, [point]: owner } };
    }),
  setNonce: (point: Ship, owner: Ownership, proxy: string, nonce: number) =>
    set(state => {
      const updatedOwner = setProxyNonce(owner, proxy, nonce);
      if (!updatedOwner) throw new Error("Can't set nonce for this proxy");
      return {
        ...state,
        nonces: { ...state.nonces, [point]: updatedOwner },
      };
    }),
  setNonces: (point: Ship, owner: Ownership) =>
    set(state => {
      return { ...state, nonces: { ...state.nonces, [point]: owner } };
    }),
  setNextBatchTime: (nextBatchTime: number) => set(() => ({ nextBatchTime })),
  setNextRoll: (nextRoll: string) => set(() => ({ nextRoll })),
  setPendingTransactions: (pendingTransactions: PendingTransaction[]) =>
    set(state => {
      const oldPending = state.pendingTransactions.length;
      if (oldPending > 0 && pendingTransactions.length === 0) {
        return {
          ...state,
          pendingTransactions,
          recentlyCompleted: oldPending,
        };
      }
      return { ...state, pendingTransactions };
    }),
  setCurrentPoint: (currentPoint: L2Point) =>
    set(() => ({
      currentPoint,
      currentL2: isL2(currentPoint?.dominion),
      currentL2Spawn: isL2Spawn(currentPoint?.dominion),
    })),
  setInvites: (invites: Invite[]) => set(() => ({ invites })),
}));
