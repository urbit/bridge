export const kLoadingCharacter = '▓';

export default val =>
  val.matchWith({
    Nothing: () => kLoadingCharacter,
    Just: p => p.value,
  });
