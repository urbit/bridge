// import { fill } from './lib'

export const prependSig = (s = '') =>
  s.length && s.charAt(0) !== '~' ? `~${s}` : s;

export const convertToNumber = s => {
  try {
    return parseInt(s, 10);
  } catch {
    return 0;
  }
};

// const hideAllButLast = s => {
//   const ll = s[s.length -1];
//   const bs = fill(s.length - 1, '•')
//   return `${bs}${ll}`
// };
//
// const hideAll = s => fill(s.length, '•');
