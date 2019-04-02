import * as ob from 'urbit-ob'

const compose = (...fs) => fs.reduceRight((pF, nF) => (...args) => nF(pF(...args)), v => v)

const allFalse = (...args) => args.every(a => a === false);

const isLast = (l, i) => i === l - 1;

const isUndefined = v => v === undefined;

const defaultTo = (v, d) => isUndefined(v) ? d : v;

const seq = n => Array.from(Array(n), (_, i) => i);

const fill = (n, v) => Array.from(Array(n), () => v);

// Terse true/false checks
const t = v => v === true;

const f = v => v === false;

const isValidGalaxy = name => {
  let point
  try {
    point = parseInt(ob.patp2dec(name), 10)
  } catch(err) {
    return false
  }
  return point >= 0 && point < 256
}

export {
  compose,
  allFalse,
  isLast,
  isUndefined,
  defaultTo,
  seq,
  fill,
  t,
  f,
  isValidGalaxy,
}
