import { hex2patp } from 'urbit-ob';
import { createRing } from 'lib/keys';

import jssha256 from 'js-sha256';

function shax(buf) {
  const hashed = jssha256.sha256.array(buf);
  return Buffer.from(hashed);
}

function hex2buf(hex) {
  return Buffer.from(hex, 'hex').reverse();
}

function buf2hex(buf) {
  return Buffer.from(buf)
    .reverse()
    .toString('hex');
}

export function shas(buf, salt) {
  return shax(xor(salt, shax(buf)));
}

function xor(a, b) {
  const length = Math.max(a.byteLength, b.byteLength);
  const result = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    result[i] = a[i] ^ b[i];
  }
  return result;
}

function shaf(buf, salt) {
  const result = shas(buf, salt);
  const halfway = result.length / 2;
  const front = result.slice(0, halfway);
  const back = result.slice(halfway, result.length);
  return xor(front, back);
}

export const generateCode = pair => {
  const ring = hex2buf(createRing(pair));
  const salt = hex2buf('73736170'); // salt is the noun %pass
  const hash = shax(ring);
  const result = shaf(hash, salt);
  const half = result.slice(0, result.length / 2);

  return hex2patp(buf2hex(half)).slice(1);
};
