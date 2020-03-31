import ob from 'urbit-ob';
import kg from 'urbit-key-generation';
import * as more from 'more-entropy';
import { chunk, flatMap, zipWith } from 'lodash';
import { shax, shas } from 'lib/networkCode';

import {
  MIN_STAR,
  MIN_PLANET,
  SEED_ENTROPY_BITS,
  GALAXY_ENTROPY_BITS,
  STAR_ENTROPY_BITS,
  PLANET_ENTROPY_BITS,
  ZOD,
} from './constants';

const SEED_LENGTH_BYTES = SEED_ENTROPY_BITS / 8;

const getEntropyBits = point =>
  point < MIN_STAR
    ? GALAXY_ENTROPY_BITS
    : point < MIN_PLANET
    ? STAR_ENTROPY_BITS
    : PLANET_ENTROPY_BITS;

// returns a promise for a ticket string
export const makeTicket = point => {
  const bits = getEntropyBits(point);

  const bytes = bits / 8;
  const some = new Uint8Array(bytes);
  window.crypto.getRandomValues(some);

  const gen = new more.Generator();

  return new Promise((resolve, reject) => {
    gen.generate(bits, result => {
      const chunked = chunk(result, 2);
      const desired = chunked.slice(0, bytes); // only take required entropy
      const more = flatMap(desired, arr => arr[0] ^ arr[1]);
      const entropy = zipWith(some, more, (x, y) => x ^ y);
      const buf = Buffer.from(entropy);
      const patq = ob.hex2patq(buf.toString('hex'));
      resolve(patq);
      reject('Entropy generation failed');
    });
  });
};

export const makeDeterministicTicket = (point, seed) => {
  const bits = getEntropyBits(point);

  const bytes = bits / 8;

  const pointSalt = Buffer.concat([
    Buffer.from(point.toString()),
    Buffer.from('invites'),
  ]);
  const entropy = shas(seed, pointSalt);

  const buf = entropy.slice(0, bytes);
  const patq = ob.hex2patq(buf.toString('hex'));
  return patq;
};

// return a wallet object
export const generateWallet = async (point, ticket, boot) => {
  const config = {
    ticket: ticket,
    seedSize: SEED_LENGTH_BYTES,
    ship: point,
    password: '',
    revisions: {},
    boot: boot,
  };

  // This is here to notify anyone who opens console because the thread
  // hangs, blocking UI updates so this cannot be done in the UI
  console.log('Generating Wallet for point address: ', point);

  const wallet = await kg.generateWallet(config);

  return wallet;
};

export const generateOwnershipWallet = (ship, ticket) =>
  kg.generateOwnershipWallet({ ship, ticket });

// temporary wallets need to be derivable from just the ticket,
// so we always use ~zod as the wallet point.
export const generateTemporaryOwnershipWallet = ticket =>
  generateOwnershipWallet(ZOD, ticket);

export const generateTemporaryTicketAndWallet = async point => {
  const ticket = await makeTicket(point);
  const owner = await generateOwnershipWallet(ZOD, ticket);

  return { ticket, owner };
};
