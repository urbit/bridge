import { Invite } from 'lib/types/Invite';

const INVITES_KEY = 'invites';
const HIDE_MIGRATION_MESSAGE_KEY = 'hide_migration_message';

export interface StoredInvites {
  available: Invite[];
  pending: Invite[];
}

export const getStoredInvites = (point: number): StoredInvites => {
  const invitesString = localStorage.getItem(INVITES_KEY) || '{}';
  const invites = JSON.parse(invitesString);

  if (invites[String(point)]) {
    return invites[String(point)];
  }

  return { available: [], pending: [] };
};

export const setStoredInvites = (point: number, newInvites: StoredInvites) => {
  const invitesString = localStorage.getItem(INVITES_KEY) || '{}';
  const invites = JSON.parse(invitesString);
  invites[Number(point)] = newInvites;
  localStorage.setItem(INVITES_KEY, JSON.stringify(invites));
};

export const setPendingInvites = (point: number, pendingInvites: Invite[]) => {
  const invites = getStoredInvites(point);
  invites.pending.push(...pendingInvites);
  setStoredInvites(point, invites);
};

export const clearInvitesStorage = () => localStorage.removeItem(INVITES_KEY);

export const getHideMigrationMessage = () =>
  Boolean(localStorage.getItem(HIDE_MIGRATION_MESSAGE_KEY));

export const storeHideMigrationMessage = () =>
  localStorage.setItem(HIDE_MIGRATION_MESSAGE_KEY, 'true');
