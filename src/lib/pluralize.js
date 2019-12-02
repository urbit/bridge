export default (count, singular, plural) => {
  const isPlural = count === 0 || count > 1;
  if (!plural) {
    return `${count} ${singular}${isPlural ? 's' : ''}`;
  }

  return isPlural ? plural : singular;
};
