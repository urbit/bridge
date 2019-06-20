export default val =>
  val.matchWith({
    Nothing: () => '▓',
    Just: p => p.value,
  });
