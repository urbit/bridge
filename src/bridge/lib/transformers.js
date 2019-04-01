// import { fill } from './lib'

const prependSig = s => s.charAt(0) !== '~' ? `~${s}` : s;

// const hideAllButLast = s => {
//   const ll = s[s.length -1];
//   const bs = fill(s.length - 1, '•')
//   return `${bs}${ll}`
// };
//
// const hideAll = s => fill(s.length, '•');


export {
  prependSig,
  // hideAllButLast,
  // hideAll,
}
