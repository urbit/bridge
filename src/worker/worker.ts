import kg from 'urbit-key-generation';

export async function generateWallet(data: string): Promise<string> {
  // Process the data without stalling the UI
  const config = JSON.parse(data);
  const wallet = await kg.generateWallet(config);

  return wallet;
}
