/*
^-  @ux
%-  jam
=>  [40 2]
!=
=-  (add +< +>)
|%
++  add
  |=  [a=@ b=@]
  ?~  a
    b
  $(a (dec a), b +(b))
++  dec
  |=  a=@
  =|  i=@
  |-
  =+  n=+(i)
  ?:  =(n a)
    i
  $(i n)
--
*/
import compiler from '../compiler.js';

import serial from '../serial.js';
import noun from '../noun.js';
import test from 'tape';
import tchk from 'tape-check';
import { BigInteger } from 'jsbn';
/*
^-  @ux
%-  jam
=>  [40 2]
!=
=-  (add +< +>)
|%
++  add
  |=  [a=@ b=@]
  ?~  a
    b
  $(a (dec a), b +(b))
++  dec
  |=  a=@
  =|  i=@
  |-
  =+  n=+(i)
  ?:  =(n a)
    i
  $(i n)
--
*/
var check      = tchk.check, gen        = tchk.gen, n          = noun.dwim, pill       = noun.Atom.fromString("829878621bce21b21920c888730c9059367e61cfcc39f98721920f9099110dd6986c86483c425fa84c8886dc2ec3b1330b26e2c9b478d937168f1b26e4e1887ab8e61b213c612cc4b21920fc4dc324164d5912c86483a425c21362dc2ec38b4e2c9ae2b041", 16), formula    = serial.cue(pill), small      = gen.intWithin(0,128), context    = new compiler.Context();

test("nock add", check(small, small, function(t, a, b) {
  t.plan(1);
  t.equal(context.nock(n(a,b), formula).valueOf(), a + b, "a+b");
}));
