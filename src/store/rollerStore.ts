import create from 'zustand';
import { PendingTransaction } from '@urbit/roller-api';

import { HOUR } from 'lib/utils/roller';
import { Invite } from 'lib/types/Invite';
import Point, { Points, Relationship } from 'lib/types/Point';
import { toL1Details } from 'lib/utils/point';

export const EMPTY_POINT = new Point(-1, Relationship.own, toL1Details({}), '');

export interface RollerStore {
  nextBatchTime: number;
  pendingTransactions: PendingTransaction[];
  point: Point;
  points: Points;
  pointList: Point[];
  invitePoints: number[];
  invites: Invite[];
  recentlyCompleted: number;
  inviteGeneratingNum: number;
  removeInvite: (point: number) => void;
  setNextBatchTime: (nextBatchTime: number) => void;
  setPendingTransactions: (pendingTransactions: PendingTransaction[]) => void;
  setPoint: (point: number) => void;
  setPoints: (points: Points) => void;
  setInvitePoints: (points: number[]) => void;
  setInvites: (invites: Invite[]) => void;
  setInviteGeneratingNum: (numGenerating: number) => void;
  updateInvite: (invite: Invite) => void;
}

export const useRollerStore = create<RollerStore>(set => ({
  nextBatchTime: new Date().getTime() + HOUR,
  pendingTransactions: [],
  point: EMPTY_POINT,
  pointList: [],
  points: {},
  invitePoints: [],
  invites: [],
  recentlyCompleted: 0,
  inviteGeneratingNum: 0,
  removeInvite: (point: number) =>
    set(state => ({
      invites: state.invites.filter(({ planet }) => point !== planet),
    })),
  setNextBatchTime: (nextBatchTime: number) => set(() => ({ nextBatchTime })),
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
  setPoint: (point: number) =>
    set(state => ({ point: state.points[point] || EMPTY_POINT })),
  setPoints: (points: Points) =>
    set(() => ({ points, pointList: Object.values(points) })),
  setInvitePoints: (invitePoints: number[]) => set(() => ({ invitePoints })),
  setInvites: (invites: Invite[]) => set(() => ({ invites })),
  setInviteGeneratingNum: (inviteGeneratingNum: number) =>
    set(() => ({ inviteGeneratingNum })),
  updateInvite: (invite: Invite) =>
    set(state => ({
      invites: state.invites.map(i =>
        i.planet === invite.planet ? invite : i
      ),
    })),
}));
