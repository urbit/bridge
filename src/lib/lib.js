import ob from 'urbit-ob';
import { patp2dec } from './patp2dec';
import { fromWei, toWei, toBN } from 'web3-utils';

const safeFromWei = (num, target) => {
  try {
    return fromWei(toBN(num), target);
  } catch (e) {
    e.message =
      `(safeFromWei got ${typeof num} (${num}), made ${typeof toBN(
        num
      )}. Please report this issue!) ` + e.message;
    throw e;
  }
};

const safeToWei = (num, source) => {
  try {
    return toWei(toBN(num), source);
  } catch (e) {
    e.message =
      `(safeToWei got ${typeof num} (${num}), made ${typeof toBN(
        num
      )}. Please report this issue!) ` + e.message;
    throw e;
  }
};

const compose = (...fs) =>
  fs.reduceRight(
    (pF, nF) => (...args) => nF(pF(...args)),
    v => v
  );

const allFalse = (...args) => args.every(a => a === false);

const isLast = (l, i) => i === l - 1;

const isUndefined = v => v === undefined;

const defaultTo = (v, d) => (isUndefined(v) ? d : v);

const seq = n => Array.from(Array(n), (_, i) => i);

const fill = (n, v) => Array.from(Array(n), () => v);

const strSplice = (arr, i, val) => `${arr.slice(0, i)}${val}${arr.slice(i)}`;

const isValidGalaxy = name => {
  let point;
  try {
    point = patp2dec(name);
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
  safeFromWei,
  safeToWei,
  compose,
  allFalse,
  isLast,
  isUndefined,
  defaultTo,
  seq,
  fill,
  strSplice,
  isValidGalaxy,
  randomPatq,
  patpStringLength,
};
