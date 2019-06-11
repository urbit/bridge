import * as ob from 'urbit-ob';

export const compose = (...fs) =>
  fs.reduceRight((pF, nF) => (...args) => nF(pF(...args)), v => v);

export const allFalse = (...args) => args.every(a => a === false);

export const isLast = (l, i) => i === l - 1;

export const isUndefined = v => v === undefined;

export const defaultTo = (v, d) => (isUndefined(v) ? d : v);

export const seq = n => Array.from(Array(n), (_, i) => i);

export const fill = (n, v) => Array.from(Array(n), () => v);

// Terse true/false checks
export const t = v => v === true;

export const f = v => v === false;

export const isValidGalaxy = name => {
  let point;
  try {
    point = parseInt(ob.patp2dec(name), 10);
  } catch (err) {
    return false;
  }
  return point >= 0 && point < 256;
};

export const randomPatq = len => {
  let bytes = window.crypto.getRandomValues(new Uint8Array(len));
  let hex = bytes.reduce(
    (acc, byt) => acc + byt.toString(16).padStart(2, '0'),
    ''
  );
  return ob.hex2patq(hex);
};
