import * as encoding from '@walletconnect/encoding';

export const mayCreateHexString = (data?: number | string) => {
  if (!data || encoding.isHexString(data)) return data;

  if (typeof data === 'number')
    return encoding.sanitizeHex(encoding.numberToHex(data));

  if (typeof data === 'string')
    return encoding.sanitizeHex(encoding.utf8ToHex(data));
};
