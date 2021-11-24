export const onlyUnique = <T>(value: T, index: number, self: T[]) =>
  self.indexOf(value) === index;
