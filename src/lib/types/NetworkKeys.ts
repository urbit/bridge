// returned from urbit/key-generation#deriveNetworkKeys
export interface NetworkKeys {
  crypt: {
    private: string;
    public: string;
  };
  auth: {
    private: string;
    public: string;
  };
}
