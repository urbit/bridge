const initCanvas = (canvas, size, ratio) => {
  const { x, y } = size;
  // let ctx = canvas.getContext('2d')

  const dpi200 = window.devicePixelRatio * (200 / 72);

  canvas.width = x * dpi200;
  canvas.height = y * dpi200;
  canvas.style.width = x + 'px';
  canvas.style.height = y + 'px';

  canvas.getContext('2d').scale(dpi200, dpi200);

  return canvas;
};

const mapToRange = (v, l1, h1, l2, h2) =>
  l2 + ((h2 - l2) * (v - l1)) / (h1 - l1);

const seq = num => Array.from(Array(num), (_, i) => i);

const compose = (...fns) =>
  fns.reduce((f, g) => (...xs) => {
    const r = g(...xs);
    return Array.isArray(r) ? f(...r) : f(r);
  });

const Matrix = {
  get: {
    at: (m, r, c) => m[r][c],
    nn: (m, r, c) => m[r - 1][c],
    ne: (m, r, c) => m[r - 1][c + 1],
    ee: (m, r, c) => m[r][c + 1],
    se: (m, r, c) => m[r + 1][c + 1],
    ss: (m, r, c) => m[r + 1][c],
    sw: (m, r, c) => m[r + 1][c - 1],
    ww: (m, r, c) => m[r][c - 1],
    nw: (m, r, c) => m[r - 1][c - 1],
  },
  set: {
    at: (m, r, c, v) => (m[r][c] = v),
    nn: (m, r, c, v) => (m[r - 1][c] = v),
    ne: (m, r, c, v) => (m[r - 1][c + 1] = v),
    ee: (m, r, c, v) => (m[r][c + 1] = v),
    se: (m, r, c, v) => (m[r + 1][c + 1] = v),
    ss: (m, r, c, v) => (m[r + 1][c] = v),
    sw: (m, r, c, v) => (m[r + 1][c - 1] = v),
    ww: (m, r, c, v) => (m[r][c - 1] = v),
    nw: (m, r, c, v) => (m[r - 1][c - 1] = v),
  },
  coord: {
    at: (r, c) => ({ r: r, c: c }),
    nn: (r, c) => ({ r: r - 1, c: c }),
    ne: (r, c) => ({ r: r - 1, c: c + 1 }),
    ee: (r, c) => ({ r: r, c: c + 1 }),
    se: (r, c) => ({ r: r + 1, c: c + 1 }),
    ss: (r, c) => ({ r: r + 1, c: c }),
    sw: (r, c) => ({ r: r + 1, c: c - 1 }),
    ww: (r, c) => ({ r: r, c: c - 1 }),
    nw: (r, c) => ({ r: r - 1, c: c - 1 }),
  },
  dirs: {
    NN: 'nn',
    NE: 'ne',
    EE: 'ee',
    SE: 'se',
    SS: 'ss',
    SW: 'sw',
    WW: 'ww',
    NW: 'nw',
  },
  new: (rs, cs) => seq(rs).map(_ => seq(cs).map(_ => 0)),
  rows: m => m.length - 1,
  cols: m => m[0].length - 1,
};

const chunkStr = (str, size) => {
  const r = new RegExp(`.{1,${size}}`, 'g');
  return str.match(r);
};

const Base3Mapping = [
  Matrix.dirs.NN,
  Matrix.dirs.NE,
  Matrix.dirs.EE,
  Matrix.dirs.SE,
  Matrix.dirs.SS,
  Matrix.dirs.SW,
  Matrix.dirs.WW,
  Matrix.dirs.NW,
];

const walk = (int, matrix) => {
  // convert the int to a base8 string, split to array
  var chunks = int.toString(8).split('');

  // convert the int to a base10 string
  var b10 = int.toString(10);

  // get number of rows and cols
  var rows = Matrix.rows(matrix);
  var cols = Matrix.cols(matrix);

  // split the length-4 number into 2 parts, which is a number from 0-99
  // if the substring is empty, substitute 10
  var sx = parseInt(b10.substring(0, 2) || 0, 10);
  var sy = parseInt(b10.substring(2, 4) || 0, 10);

  // generate a starting coordinate
  var coord = {
    c: ~~mapToRange(sx, 0, 99, 0, cols),
    r: ~~mapToRange(sy, 0, 99, 0, rows),
  };

  var vect;
  var next;

  for (var i = 0; i < chunks.length; i++) {
    // Each chunk is a number from 0-7 which refers to a direction assigned in Base3Mapping.
    // Get the current chunk, and then get the direction it has been paired with.
    vect = Base3Mapping[chunks[i]];

    // generate the next coordinate to go to, based on the current coordinate and the direction stored in vect.
    next = Matrix.coord[vect](coord.r, coord.c);

    // If at an edge of the matrix, substitute the opposite direction.
    if (next.r < 0) vect = Matrix.dirs.SS;
    if (next.c < 0) vect = Matrix.dirs.EE;
    if (next.r > rows) vect = Matrix.dirs.NN;
    if (next.c > cols) vect = Matrix.dirs.WW;

    // If at in the corner of the matrix, substitute an alternative direction.
    if (next.r === 0 && coord.c === 0) vect = Matrix.dirs.SE;
    if (next.r > rows && coord.c === 0) vect = Matrix.dirs.NE;
    if (next.r === 0 && coord.c > cols) vect = Matrix.dirs.SW;
    if (next.r > rows && coord.c > cols) vect = Matrix.dirs.NW;

    // get the next coordinate again in case there was an edge/cornercase
    next = Matrix.coord[vect](coord.r, coord.c);

    // increment the value at the next coordinate.
    Matrix.set.at(
      matrix,
      next.r,
      next.c,
      Matrix.get.at(matrix, next.r, next.c) + 1
    );

    // set the new current coordinate.
    coord = next;
  }

  // return a 2-ary array in order to pass both values to the next function in the compose pipeline.
  return [int, matrix];
};

const rand = (int, matrix) => {
  // break base10 integer into chunks with length of 4
  var chunks = chunkStr(int.toString(10), 4);
  var cols = Matrix.cols(matrix);
  var rows = Matrix.rows(matrix);
  var ch;
  var x;
  var y;
  var c;
  var r;

  for (var i = 0; i < chunks.length; i++) {
    // for each chunk in chunks
    ch = chunks[i];

    // split the length-4 number into 2 parts, which is a number from 0-99
    // if the substring is empty, substitute 10
    x = parseInt(ch.substring(0, 2) || 0, 10);
    y = parseInt(ch.substring(2, 4) || 0, 10);

    // map num from 0-99 to 0 - num of cols, then use ~~ for fast math.floor
    // c (col) and r (row) are coordinates
    c = ~~mapToRange(x, 0, 99, 0, cols);
    r = ~~mapToRange(y, 0, 99, 0, rows);

    // increment number at the coordinate
    Matrix.set.at(matrix, r, c, Matrix.get.at(matrix, r, c) + 1);
  }

  // return a 2-ary array in order to pass both values to the next function in the compose pipeline.
  return [int, matrix];
};

export { chunkStr, initCanvas, seq, Matrix, compose, mapToRange, walk, rand };
