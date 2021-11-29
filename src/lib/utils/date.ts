const months = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export const ddmmmYYYY = (time: number) => {
  const date = new Date(time);
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
};
