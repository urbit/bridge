import * as bip32 from 'bip32';
import * as bip39 from 'bip39';
import keccak from 'keccak';
import { reduce } from 'lodash';
import { Just, Nothing } from 'folktale/maybe';
import * as secp256k1 from 'secp256k1';
import * as kg from 'urbit-key-generation/dist';
import { isAddress } from 'web3-utils';

export const DEFAULT_HD_PATH = "m/44'/60'/0'/0/0";
export const ETH_ZERO_ADDR = '0x0000000000000000000000000000000000000000';
export const ETH_ZERO_ADDR_SHORT = '0x0';
export const CURVE_ZERO_ADDR =
  '0x0000000000000000000000000000000000000000000000000000000000000000';

export const WALLET_TYPES = {
  MNEMONIC: Symbol('MNEMONIC'),
  TICKET: Symbol('TICKET'),
  SHARDS: Symbol('SHARDS'),
  LEDGER: Symbol('LEDGER'),
  TREZOR: Symbol('TREZOR'),
  PRIVATE_KEY: Symbol('PRIVATE_KEY'),
  KEYSTORE: Symbol('KEYSTORE'),
};

export function EthereumWallet(privateKey) {
  this.privateKey = privateKey;
  this.publicKey = secp256k1.publicKeyCreate(this.privateKey);
  const pub = this.publicKey.toString('hex');
  this.address = addressFromSecp256k1Public(pub);
}

export const addressFromSecp256k1Public = pub => {
  const compressed = false;
  const uncompressed = secp256k1.publicKeyConvert(
    Buffer.from(pub, 'hex'),
    compressed
  );
  const chopped = uncompressed.slice(1); // chop parity byte
  const hashed = keccak256(chopped);
  const addr = addHexPrefix(hashed.slice(-20).toString('hex'));
  return toChecksumAddress(addr);
};

// TODO: move all of these generic crypto helpers to another file
export const addHexPrefix = hex =>
  hex.slice(0, 2) === '0x' ? hex : '0x' + hex;

export const stripHexPrefix = hex =>
  hex.slice(0, 2) === '0x' ? hex.slice(2) : hex;

export const keccak256 = str =>
  keccak('keccak256')
    .update(str)
    .digest();

export const isValidAddress = a => '0x0' === a || isAddress(a);

export const isZeroAddress = a => ETH_ZERO_ADDR === a;

export const toChecksumAddress = address => {
  const addr = stripHexPrefix(address).toLowerCase();
  const hash = keccak256(addr).toString('hex');

  return reduce(
    addr,
    (acc, char, idx) =>
      parseInt(hash[idx], 16) >= 8 ? acc + char.toUpperCase() : acc + char,
    '0x'
  );
};

export const eqAddr = (addr0, addr1) =>
  toChecksumAddress(addr0) === toChecksumAddress(addr1);

export const urbitWalletFromTicket = async (ticket, point, passphrase) => {
  return await kg.generateWallet({
    ticket: ticket,
    ship: point,
    passphrase: passphrase,
  });
};

export const walletFromMnemonic = (mnemonic, hdpath, passphrase) => {
  const seed = bip39.validateMnemonic(mnemonic)
    ? Just(bip39.mnemonicToSeed(mnemonic, passphrase))
    : Nothing();

  const toWallet = (sd, path) => {
    let wal;
    try {
      const hd = bip32.fromSeed(sd);
      wal = hd.derivePath(path);
      wal.address = addressFromSecp256k1Public(wal.publicKey);
      wal = Just(wal);
    } catch (_) {
      wal = Nothing();
    }
    return wal;
  };

  const wallet = seed.chain(sd => toWallet(sd, hdpath));
  return wallet;
};
