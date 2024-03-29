import ob from 'urbit-ob';

import { convertToInt } from './convertToInt';

/**
 * Convert a patp string into a number, or throw.
 *
 * @throws
 * @return number
 */
export const patp2dec = patp => convertToInt(ob.patp2dec(patp), 10);
