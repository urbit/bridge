import kg from 'urbit-key-generation';

export const WalletGenerator = {
  async generateWallet(data: string): Promise<UrbitWallet> {
    // Process the data without stalling the UI
    const config = JSON.parse(data);
    const wallet = await kg.generateWallet(config);

    return wallet;
  },
}

export default WalletGenerator;
