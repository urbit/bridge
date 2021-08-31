export const SECOND = 1000;
export const MINUTE = SECOND * 60;
export const HOUR = MINUTE * 60;

export const padZero = (amount: number) => `${amount < 10 ? '0' : ''}${amount}`;

export const getTimeToNextBatch = (nextBatch: number, now: number) => {
  const toNext = nextBatch - now;
  const hours = Math.floor(toNext / HOUR);
  const minutes = Math.floor((toNext - hours * HOUR) / MINUTE);
  const seconds = Math.floor(
    (toNext - hours * HOUR - minutes * MINUTE) / SECOND
  );

  return `${hours}h ${padZero(minutes)}m ${padZero(seconds)}s`;
};
