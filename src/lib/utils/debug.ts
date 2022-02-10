import { isDevelopment } from 'lib/flags';

export const debugLog = (msg: string) => {
  if (isDevelopment) {
    console.log(msg);
  }
};
