import { isNaN } from 'lodash';

/**
 * a version of parseInt that throws for NaN
 * fun fact, parseInt also handles 0x-prefixed hex strings, assuming the radix
 * to be 16
 *
 * @throws
 * @returns {number}
 */
export default (num, radix) => {
  const res = parseInt(num, radix);
  if (isNaN(res)) {
    throw new Error('NaN');
  }
  return res;
};
