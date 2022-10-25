import { generateWallet } from 'urbit-key-generation';

export const generate = async (data: string): Promise<UrbitWallet> => {
  // Process the data without stalling the UI
  const config = JSON.parse(data);
  const wallet = await generateWallet(config);

  return wallet;
};
