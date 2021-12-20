// import * as bip32 from 'bip32';
import * as bip39 from 'bip39';
import { bip32 } from 'bitcoinjs-lib';
import { Just, Nothing } from 'folktale/maybe';
import * as kg from 'urbit-key-generation';
import BridgeWallet from './types/BridgeWallet';
import { publicToAddress } from './utils/address';

export const urbitWalletFromTicket = async (
  ticket: string,
  point: number,
  passphrase?: string
) => {
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

  const toWallet = (sd: Buffer, path: string) => {
    let wal: BridgeWallet;
    const hd = bip32.fromSeed(sd);
    // tsc complains because address is not available; it is set on the next line
    //@ts-ignore
    wal = hd.derivePath(path);
    wal.address = publicToAddress(wal.publicKey);
    wal.passphrase = passphrase || '';
    wal = Just(wal);
    return wal;
  };

  const wallet = seed.chain((sd: Buffer) => toWallet(sd, hdpath));

  return wallet;
};
