import SecureLS from 'secure-ls';
import { Invite, Invites } from 'lib/types/Invite';

const INVITES_KEY = 'invites';
const HIDE_MIGRATION_MESSAGE_KEY = 'hide_migration_message';

export const getStoredInvites = (ls: SecureLS): Invites => {
  let invites = {};
  try {
    invites = ls.get(INVITES_KEY);
  } catch (e) {}
  return invites;
};

export const setStoredInvites = (ls: SecureLS, newInvites: Invite[]) => {
  let invites: Invites = {};
  try {
    invites = ls.get(INVITES_KEY);
  } catch (e) {}

  newInvites.forEach(invite => {
    invites[Number(invite.planet)] = invite;
  });
  ls.set(INVITES_KEY, invites);
};

export const clearInvitesStorage = () => localStorage.removeItem(INVITES_KEY);

export const getHideMigrationMessage = () =>
  Boolean(localStorage.getItem(HIDE_MIGRATION_MESSAGE_KEY));

export const storeHideMigrationMessage = () =>
  localStorage.setItem(HIDE_MIGRATION_MESSAGE_KEY, 'true');
