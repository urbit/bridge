import nounT from './noun.js';
import bits from '../bits.js';
import test from 'tape';
import tchk from 'tape-check';
var check = tchk.check;

test('bytes', check({times: 10000}, nounT.genAtom, function (t, a) {
  t.plan(1);
  nounT.equals(t, bits.bytesToAtom(bits.atomToBytes(a)), a, 'round trip');
}));

test('words', check({times: 10000}, nounT.genAtom, function (t, a) {
  t.plan(1);
  nounT.equals(t, bits.wordsToAtom(bits.atomToWords(a)), a, 'round trip');
}));
