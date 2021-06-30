import { mnemonicToSeedSync } from 'bip39';
import { bip32 } from 'bitcoinjs-lib';
import { publicToAddress } from './address';

describe('#bufferedPublicKeyToAddress', () => {
  // TODO: why does this seemingly work in the Mnemonic login flow, but not in a test?
  it.skip('derives an address from a public key buffer', () => {
    const mnemonic =
      'benefit crew supreme gesture quantum web media hazard theory mercy wing kitten';
    const hdpath = "m/44'/60'/0'/0/0";
    const seed = mnemonicToSeedSync(mnemonic);
    const hd = bip32.fromSeed(seed);
    const wallet = hd.derivePath(hdpath);

    const expected = 'foo';

    expect(publicToAddress(wallet.publicKey)).toEqual(expected);
  });
});
