import { publicToAddress } from 'ethereumjs-util'

describe('#publicToAddress', () => {
  const key =
    '0207a5bb85bee2dff7ca9059eed9fcd3fb19e9c279e34efa07977b89f8eabcb762';

  const keyBuffer = Buffer.from(key);
  console.log(keyBuffer.toString());
  console.log(keyBuffer.length);
  const address = publicToAddress(keyBuffer, true);

  expect(address.toString('hex')).toBeDefined();
})
