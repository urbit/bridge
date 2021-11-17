import create from 'zustand';
import { PendingTransaction } from '@urbit/roller-api';

import { HOUR } from 'lib/utils/roller';
import { Invite, Invites } from 'lib/types/Invite';
import Point, { Points, Relationship } from 'lib/types/Point';
import { toL1Details } from 'lib/utils/point';

export const EMPTY_POINT = new Point(-1, Relationship.own, toL1Details({}), '');

export interface RollerStore {
  nextBatchTime: number;
  pendingTransactions: PendingTransaction[];
  point: Point;
  points: Points;
  pointList: Point[];
  invites: Invites;
  recentlyCompleted: number;
  inviteGeneratingNum: number;
  setNextBatchTime: (nextBatchTime: number) => void;
  setPendingTransactions: (pendingTransactions: PendingTransaction[]) => void;
  setPoint: (point: number) => void;
  setPoints: (points: Points) => void;
  setInvites: (points: number, invites: Invite[]) => void;
  setInviteGeneratingNum: (numGenerating: number) => void;
  updateInvite: (point: number, invite: Invite) => void;
}

export const useRollerStore = create<RollerStore>(set => ({
  nextBatchTime: new Date().getTime() + HOUR,
  pendingTransactions: [],
  point: EMPTY_POINT,
  pointList: [],
  points: {},
  invites: {},
  recentlyCompleted: 0,
  inviteGeneratingNum: 0,
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
  setInvites: (point: number, invites: Invite[]) =>
    set(state => {
      const newInvites: Invites = {};
      newInvites[point] = invites;
      return { invites: Object.assign(state.invites, newInvites) };
    }),
  setInviteGeneratingNum: (inviteGeneratingNum: number) =>
    set(() => ({ inviteGeneratingNum })),
  updateInvite: (point: number, invite: Invite) =>
    set(state => {
      const newInvites: Invites = {};
      newInvites[point] = state.invites[point]?.map(i =>
        i.planet === invite.planet ? invite : i
      );
      return { invites: Object.assign(state.invites, newInvites) };
    }),
}));
