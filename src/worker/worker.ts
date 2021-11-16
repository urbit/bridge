import kg from 'urbit-key-generation';

export async function generateWallet(data: string): Promise<string> {
  console.log(2, data)
  // Process the data without stalling the UI
  const config = JSON.parse(data);
  console.log(3)
  const wallet = await kg.generateWallet(config);
  console.log(4)

  return wallet;
}
