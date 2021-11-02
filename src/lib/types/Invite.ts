export interface Invite {
  ticket: string;
  planet: number;
  hash: string;
  owner: string;
}

export interface Invites {
  [key: number]: Invite;
}
