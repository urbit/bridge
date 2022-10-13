import noun from './noun.js';
var Cell = noun.Cell, zero = noun.Atom.yes;

function flop(a) {
	var b = zero;

	while ( true ) {
		if ( zero.equals(a) ) {
			return b;
		}
		else if ( !a.deep ) {
      throw new Error("Bail");
		}
		else {
      b = new Cell(a.head, b);
      a = a.tail;
		}
	}
}

function forEach(n, f) {
  while ( true ) {
    if ( zero.equals(n) ) {
      return;
    }
    else if ( !n.deep ) {
      throw new Error("Bail");
    }
    else {
      f(n.head);
      n = n.tail;
    }
  }
}

export default {
  flop: flop,
  forEach: forEach,
};
