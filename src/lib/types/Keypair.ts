// returned from urbit/key-generation#deriveNodes
export interface Keypair {
  public: string;
  private: string;
  chain: string;
  address: string;
}
