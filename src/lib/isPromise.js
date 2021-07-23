// an object is a promise if it has a `.then` function
// https://github.com/then/is-promise/blob/master/index.js
export const isPromise = obj =>
  !!obj &&
  (typeof obj === 'object' || typeof obj === 'function') &&
  typeof obj.then === 'function';
