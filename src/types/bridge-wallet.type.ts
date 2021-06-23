import { BIP32Interface } from 'bitcoinjs-lib';

interface BridgeWallet extends BIP32Interface {
  address: string;
  passphrase: string;
}
