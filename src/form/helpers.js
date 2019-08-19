export const WARNING = 'warn';

// if the object only has the WARNING key
export const onlyHasWarning = obj =>
  !!obj && Object.keys(obj).length === 1 && !!obj[WARNING];
