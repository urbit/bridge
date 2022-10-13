/*
^-  @ux
%-  jam
=>  [2 2]
!=
=-  (ack +< +>)
=>  %kack
~%  %kack  ~  ~
|%
++  dec
  ~/  %dec
  |=  a=@
  =|  i=@
  |-
  =+  n=+(i)
  ?:  =(n a)
    i
  $(i n)
++  ack
  ~/  %ack
  |=  [m=@ n=@]
  ?~  m  +(n)
  ?~  n  $(m (dec m), n 1)
  $(m (dec m), n $(n (dec n)))
--
*/
import compiler from '../compiler.js';

import serial from '../serial.js';
import noun from '../noun.js';
import bits from '../bits.js';
import test from 'tape';
/*
^-  @ux
%-  jam
=>  [2 2]
!=
=-  (ack +< +>)
=>  %kack
~%  %kack  ~  ~
|%
++  dec
  ~/  %dec
  |=  a=@
  =|  i=@
  |-
  =+  n=+(i)
  ?:  =(n a)
    i
  $(i n)
++  ack
  ~/  %ack
  |=  [m=@ n=@]
  ?~  m  +(n)
  ?~  n  $(m (dec m), n 1)
  $(m (dec m), n $(n (dec n)))
--
*/
var n          = noun.dwim, pill       = noun.Atom.fromString("6eca1c00a1bac286c86483dc21dc324164dbf18777e361a371d5186b441bf187fe30f5b1b0bc071d5186b441bf1870028700287bb287d612eb0a1b21920e2aa1b26ce8a1af7086c8648384a86bdc21b21920c00a1e6364278c2598964324180143986482c9abdc21b21920b47a87df8db85d87484cc2e109efc6dc2ec38b4e2c9afc37e30ef8971b2b23c071e8e6c2cdf0168837e30f2643241f213dc21b9421b21920f1097ea13225b85d876266164dc5937bf1b26e2d8b26bf0b8b26eb63616bf818bf0b041", 16), formula    = serial.cue(pill), context    = new compiler.Context();

var getSample = noun.Noun.fragmenter(n(6)),
    jetCalled = false;
function decJet(core) {
  jetCalled = true;
  return bits.dec(getSample(core));
}

test("nock ackermann function", function(t) {
  t.plan(3);
  t.equal(context.nock(n(2,2), formula).valueOf(), 7, "unjetted 2,2");
  context = new compiler.Context(["kack", null, [["dec", decJet]]]);
  formula = serial.cue(pill); // old formula will remember there is no jet for dec
  t.equal(context.nock(n(3,9), formula).valueOf(), 4093, "jetted 3,9");
  t.ok(jetCalled, 'jet was called');
});
