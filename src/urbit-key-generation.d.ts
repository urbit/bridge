type ValueOf<T> = T[keyof T];

type CHILD_SEED_TYPES = {
  OWNERSHIP: 'ownership';
  TRANSFER: 'transfer';
  SPAWN: 'spawn';
  VOTING: 'voting';
  MANAGEMENT: 'management';
  NETWORK: 'network';
  BITCOIN_MAINNET: 'bitcoinMainnet';
  BITCOIN_TESTNET: 'bitcoinTestnet';
};

type ChildSeedType = ValueOf<CHILD_SEED_TYPES>;

interface NetworkKeys {
  crypt: {
    private: string;
    public: string;
  };
  auth: {
    private: string;
    public: string;
  };
}

interface WalletNodeKeys {
  public: string;
  private: string;
  chain: string;
  address: string;
}

interface WalletNode {
  type: string;
  seed: string;
  keys: WalletNodeKeys;
  derivationPath: string;
}

interface BitcoinWallet extends WalletNode {}

interface WalletConfig {
  ticket: string;
  ship: number;
  passphrase?: string;
  boot?: boolean;
}

interface UrbitWallet {
  meta: {
    generator: {
      name: string;
      version: string;
    };
    spec: string;
    ship: string;
    patp: string;
    tier: string;
    passphrase: string;
  };
  masterSeed: string;
  ownership: WalletNode;
  management: WalletNode;
  transfer: WalletNode;
  network:
    | {
        type: string;
        seed: string;
        keys: string;
      }
    | {};
  voting?: WalletNode;
  spawn?: WalletNode;
  bitcoinTestnet: BitcoinWallet;
  bitcoinMainnet: BitcoinWallet;
}

declare module 'urbit-key-generation' {
  const CHILD_SEED_TYPES: CHILD_SEED_TYPES;
  function addressFromSecp256k1Public(pub: string): string;
  function argon2u(entropy: Buffer, ship: number): Promise<Uint8Array>;
  function combine(shards: string[]): string;
  function deriveNetworkInfo(
    mnemonic: string,
    revision: number,
    passphrase?: string
  ): { type: 'network'; seed: string; keys: WalletNodeKeys };
  function deriveNetworkKeys(hex: string): NetworkKeys;
  function deriveNetworkSeed(
    mnemonic: string,
    passphrase: string,
    revision: number
  ): string;
  function deriveNode(
    master: Uint8Array,
    type: ChildSeedType,
    derivationPath: string,
    passphrase?: string
  ): WalletNode;
  function deriveNodeKeys(
    mnemonic: string,
    derivationPath: string,
    passphrase?: string
  ): WalletNodeKeys;
  function deriveNodeSeed(master: Uint8Array, type: ChildSeedType): string;
  function generateCode(pair: NetworkKeys, step: number): string;
  function generateKeyfile(
    pair: NetworkKeys,
    point: number,
    revision: number
  ): string;
  function generateOwnershipWallet({
    ticket,
    ship,
    passphrase,
  }: WalletConfig): UrbitWallet;
  function generateWallet({
    ticket,
    ship,
    passphrase,
    boot,
  }: WalletConfig): UrbitWallet;
  function shard(ticket: string): string[];
}
