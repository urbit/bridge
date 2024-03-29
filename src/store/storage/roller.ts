import SecureLS from 'secure-ls';
import { Invite, InviteTickets } from 'lib/types/Invite';

const INVITES_KEY = 'invites';
const HIDE_MIGRATION_MESSAGE_KEY = 'hide_migration_message';

export const getStoredInvites = (ls: SecureLS): InviteTickets => {
  let invites = {};
  try {
    invites = ls.get(INVITES_KEY);
  } catch (e) {}
  return invites;
};

export const setStoredInvites = (ls: SecureLS, newInvites: Invite[]) => {
  let invites: InviteTickets = {};
  try {
    invites = ls.get(INVITES_KEY) || {};
  } catch (e) {}

  newInvites.forEach(invite => {
    invites[Number(invite.planet)] = invite;
  });
  ls.set(INVITES_KEY, invites);
};

export const setStoredInvite = (ls: SecureLS, newInvite: Invite) => {
  let invites: InviteTickets = {};
  try {
    invites = ls.get(INVITES_KEY) || {};
  } catch (e) {}

  invites[Number(newInvite.planet)] = newInvite;
  ls.set(INVITES_KEY, invites);
};

export const removeStoredInvite = (ls: SecureLS, key: number) => {
  let invites: InviteTickets = {};
  try {
    invites = ls.get(INVITES_KEY) || {};
  } catch (e) {}

  if (key in invites) {
    let { [key]: _, ...filtered } = invites;
    invites = filtered;
  }

  ls.set(INVITES_KEY, invites);
};

export const clearInvitesStorage = () => localStorage.removeItem(INVITES_KEY);

export const getHideMigrationMessage = () =>
  Boolean(localStorage.getItem(HIDE_MIGRATION_MESSAGE_KEY));

export const storeHideMigrationMessage = () =>
  localStorage.setItem(HIDE_MIGRATION_MESSAGE_KEY, 'true');
