import { Invite } from "types/Invite";

const INVITES_KEY = 'invites';

export interface StoredInvites {
  available: Invite[];
  pending: Invite[];
  claimed: Invite[];
}

export const getStoredInvites = (point: string): StoredInvites => {
  const invitesString = localStorage.getItem(INVITES_KEY) || '{}';
  console.log(invitesString)
  const invites = JSON.parse(invitesString);

  console.log('STORED INVITES', invites);

  if (invites[point]) {
    return invites[point];
  }

  return { available: [], pending: [], claimed: [] };
};

export const setStoredInvites = (point: string, newInvites: StoredInvites) => {
  const invitesString = localStorage.getItem(INVITES_KEY) || '{}';
  const invites = JSON.parse(invitesString);
  invites[point] = newInvites;
  localStorage.setItem(INVITES_KEY, JSON.stringify(invites));
};

export const setPendingInvites = (point: string, pendingInvites: Invite[]) => {
  const invites = getStoredInvites(point);
  invites.pending.push(...pendingInvites);
  setStoredInvites(point, invites);
};
