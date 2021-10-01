import { Invite } from 'lib/types/Invite';

const INVITES_KEY = 'invites';
const HIDE_MIGRATION_MESSAGE_KEY = 'hide_migration_message';

export const getStoredInvites = (point: number): Invite[] => {
  const invitesString = localStorage.getItem(INVITES_KEY) || '{}';
  const invites = JSON.parse(invitesString);

  if (invites[String(point)]) {
    return invites[String(point)];
  }

  return [];
};

export const setStoredInvites = (point: number, newInvites: Invite[]) => {
  const invitesString = localStorage.getItem(INVITES_KEY) || '{}';
  const invites = JSON.parse(invitesString);
  invites[Number(point)] = newInvites;
  localStorage.setItem(INVITES_KEY, JSON.stringify(invites));
};

export const clearInvitesStorage = () => localStorage.removeItem(INVITES_KEY);

export const getHideMigrationMessage = () =>
  Boolean(localStorage.getItem(HIDE_MIGRATION_MESSAGE_KEY));

export const storeHideMigrationMessage = () =>
  localStorage.setItem(HIDE_MIGRATION_MESSAGE_KEY, 'true');
