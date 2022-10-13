/*
 * =<  (dec 43)
 * |%
 * ++  dec
 *   |=  a/@
 *   =|  i/@
 *   |-
 *   =/  n/@  +(i)
 *   ?:  =(a n)
 *     i
 *   $(i n)
 * --
 * [8 [1 8 [1 0] [1 8 [1 0] 8 [1 8 [4 0 6] 
                                 6 [5 [0 62] 0 2] 
                                   [0 14] 
                                 9 2 [0 6] [0 2] 0 15]
                                 9 2 0 1] 0 1]
    8 [9 2 0 1] 9 2 [0 4] [7 [0 3] 1 43] 0 11]
 */
import noun from '../noun.js';

nounT = require('./noun.js'),
n = noun.dwim,
compiler = require('../compiler.js'),
context  = new compiler.Context(),
formula = n(8, [1, 8, [1, 0], [1, 8, [1, 0], 8, [1, 8, [4, 0, 6],
                                             6, [5, [0, 62], 0, 2],
                                               [0, 14],
                                             9, 2, [0, 6], [0, 2], 0, 15],
                                             9, 2, 0, 1], 0, 1],
            8, [9, 2, 0, 1], 9, 2, [0, 4], [7, [0, 3], 1, 43], 0, 11),
product = context.nock(n(0), formula);
test = require('tape');

test('decrement', function (t) {
  t.plan(1);
  nounT.equals(t, product, n(42), 'dec(43) == 42');
});
