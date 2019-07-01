import * as ob from 'urbit-ob';

/**
 * Convert a patp string into a number, or throw.
 *
 * @throws
 * @return number
 */
export default patp => parseInt(ob.patp2dec(patp), 10);
