import serial from '../serial.js';
import noun from '../noun.js';
import test from 'tape';
import { check } from 'tape-check';
import nounT from './noun.js';
import { BigInteger } from 'jsbn';
var n          = noun.dwim;

test('examples', function(t) {
  t.plan(5);
  nounT.equals(t, serial.jam(n(42)), n(5456), 'jam 1');
  nounT.equals(t, serial.cue(n(5456)), n(42), 'cue 1');
  nounT.equals(t, serial.jam(n('foo', 'bar')), noun.Atom.fromString('1054973063816666730241'), 'jam 2');
  nounT.equals(t, serial.cue(noun.Atom.fromString('1054973063816666730241')), n('foo', 'bar'), 'cue 2');
  var addPill = new noun.Atom.Atom(new BigInteger("829878621bce21b21920c888730c9059367e61cfcc39f98721920f9099110dd6986c86483c425fa84c8886dc2ec3b1330b26e2c9b478d937168f1b26e4e1887ab8e61b213c612cc4b21920fc4dc324164d5912c86483a425c21362dc2ec38b4e2c9ae2b041", 16));
  nounT.equals(t, serial.jam(serial.cue(addPill)), addPill, "add pill");
});

test('generative', check({times: 1000}, nounT.genNoun, function(t, n) {
  t.plan(1);
  nounT.equals(t, serial.cue(serial.jam(n)), n, 'round trip');
}));
