// NB(shrugs): if we get any more complicated with dates, add `luxon`
export const formatDots = date => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, 0);
  const day = `${date.getDate()}`.padStart(2, 0);

  return [year, month, day].join('.');
};
