export interface Invite {
  ticket: string;
  planet: number;
  hash: string;
  owner: string;
  status: 'pending' | 'sending' | 'claimed' | 'available';
}
