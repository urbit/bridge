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

declare module 'urbit-key-generation' {
  function deriveNetworkKeys(hex: string): NetworkKeys;
}
