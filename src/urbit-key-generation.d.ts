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
}

declare module 'urbit-key-generation' {
  function combine(shards: string[]): string;
  function deriveNetworkKeys(hex: string): NetworkKeys;
  function generateWallet({
    ticket,
    ship,
    passphrase,
    boot,
  }: WalletConfig): UrbitWallet;
}
