// import * as bip32 from 'bip32';
import * as bip39 from 'bip39';
import { bip32 } from 'bitcoinjs-lib';
import { Just, Nothing } from 'folktale/maybe';
import * as secp256k1 from 'secp256k1';
import * as kg from 'urbit-key-generation';
import { publicToAddress } from './utils/address';

export function EthereumWallet(privateKey) {
  this.privateKey = privateKey;
  this.publicKey = secp256k1.publicKeyCreate(this.privateKey);
  this.address = publicToAddress(this.publicKey);
}

export const urbitWalletFromTicket = async (ticket, point, passphrase) => {
  return await kg.generateWallet({
    ticket: ticket,
    ship: point,
    passphrase: passphrase,
  });
};

export const walletFromMnemonic = (
  mnemonic: string,
  hdpath: string,
  passphrase?: string,
  skipMnemonicCheck?: boolean
) => {
  const seed =
    skipMnemonicCheck || bip39.validateMnemonic(mnemonic)
      ? Just(bip39.mnemonicToSeedSync(mnemonic, passphrase))
      : Nothing();

  const toWallet = (sd, path) => {
    let wal;
    const hd = bip32.fromSeed(sd);
    wal = hd.derivePath(path);
    wal.address = publicToAddress(wal.publicKey);
    wal.passphrase = passphrase || '';
    wal = Just(wal);
    return wal;
  };

  const wallet = seed.chain(sd => toWallet(sd, hdpath));

  return wallet;
};
