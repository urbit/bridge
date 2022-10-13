import nounT from './noun.js';
import test from 'tape';
import tchk from 'tape-check';
import { NounMap } from '../hamt.js';
var check = tchk.check;

var g = nounT.genNoun,
    m = new NounMap();

test('maps work like maps', check({ times: 1000 }, g, g, g, function (t, k, v1, v2) {
  t.plan(2);
  m.insert(k, v1);
  nounT.equals(t, m.get(k), v1, "first insert");
  m.insert(k, v2);
  nounT.equals(t, m.get(k), v2, "second insert");
}));
