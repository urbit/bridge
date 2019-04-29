
import * as ob from 'urbit-ob'
import * as kg from '../../../node_modules/urbit-key-generation/dist/index'
import * as more from 'more-entropy'
import lodash from 'lodash'
import {
  MAX_GALAXY, MIN_STAR, MAX_STAR, MIN_PLANET,
  GALAXY_ENTROPY_BITS, STAR_ENTROPY_BITS, PLANET_ENTROPY_BITS,
  SEED_ENTROPY_BITS,
  GEN_STATES
} from './constants'

const SEED_LENGTH_BYTES = SEED_ENTROPY_BITS / 8

// returns a promise for a ticket string
const makeTicket = point => {

  const bits = point < MIN_STAR
    ? GALAXY_ENTROPY_BITS
    : point < MIN_PLANET
      ? STAR_ENTROPY_BITS
      : PLANET_ENTROPY_BITS

  const bytes = bits / 8
  const some = new Uint8Array(bytes)
  window.crypto.getRandomValues(some)

  const gen = new more.Generator()

  return new Promise((resolve, reject) => {
    gen.generate(bits, result => {
      const chunked = lodash.chunk(result, 2)
      const desired = chunked.slice(0, bytes) // only take required entropy
      const more = lodash.flatMap(desired, arr => arr[0] ^ arr[1])
      const entropy = lodash.zipWith(some, more, (x, y) => x ^ y)
      const buf = Buffer.from(entropy)
      const patq = ob.hex2patq(buf.toString('hex'))
      resolve(patq)
      reject('Entropy generation failed')
    })
  })
}

// return a wallet object
const generateWallet = async (point, ticket, boot) => {

  const config = {
    ticket: ticket,
    seedSize: SEED_LENGTH_BYTES,
    ship: point,
    password: '',
    revisions: {},
    boot: boot
  };

  const wallet = await kg.generateWallet(config);

  // This is here to notify the anyone who opens console because the thread
  // hangs, blocking UI updates so this cannot be doen in the UI
  console.log('Generating Wallet for point address: ', point);

  return wallet;
}

const seq = num => Array.from(Array(num), (_, i) => i)

const compose = (...fs) => fs.reduceRight((pF, nF) => (...args) => nF(pF(...args)), v => v)

export {
  makeTicket,
  generateWallet,
  compose,
  seq,
}
