import * as ob from 'urbit-ob';

const compose = (...fs) =>
  fs.reduceRight((pF, nF) => (...args) => nF(pF(...args)), v => v);

const allFalse = (...args) => args.every(a => a === false);

const isLast = (l, i) => i === l - 1;

const isUndefined = v => v === undefined;

const defaultTo = (v, d) => (isUndefined(v) ? d : v);

const seq = n => Array.from(Array(n), (_, i) => i);

const fill = (n, v) => Array.from(Array(n), () => v);

const isValidGalaxy = name => {
  let point;
  try {
    point = parseInt(ob.patp2dec(name), 10);
  } catch (err) {
    return false;
  }
  return point >= 0 && point < 256;
};

const randomPatq = len => {
  let bytes = window.crypto.getRandomValues(new Uint8Array(len));
  let hex = bytes.reduce(
    (acc, byt) => acc + byt.toString(16).padStart(2, '0'),
    ''
  );
  return ob.hex2patq(hex);
};

// TODO: is there a function for this calculation in urbit-ob or similar?
// 3 characters per byte, plus a tilde and hypen prefix per pair of bytes
const patpStringLength = byteLength =>
  byteLength * 3 + Math.ceil(byteLength / 2);

export {
  compose,
  allFalse,
  isLast,
  isUndefined,
  defaultTo,
  seq,
  fill,
  isValidGalaxy,
  randomPatq,
  patpStringLength,
};
