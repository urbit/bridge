import { compose, strSplice } from 'lib/lib';

const TICKET_MAX_BYTE_LEN = 32; // tickets can be as large as 32 bytes

export const buildFormatter = (formatters = []) =>
  compose(...formatters.reverse());

/**
 * inserts a ~ or - every 7 characters
 */
export const ensurePatFormat = s => {
  if (!s || s.length === 0) {
    return s || '';
  }

  // ensure there's a dash every 6 + 1 characters
  const dashAt = i => i * (6 + 1);
  const maxBlocks = TICKET_MAX_BYTE_LEN / 2;

  for (let i = 0; i !== maxBlocks; i++) {
    const dashIndex = dashAt(i);

    if (s.length - 1 < dashIndex) {
      return s;
    }

    const sep = i === 0 ? '~' : '-';

    if (s.charAt(dashIndex) !== sep) {
      s = strSplice(s, dashIndex, sep);
    }
  }

  return s;
};

export const convertToNumber = s => {
  try {
    return parseInt(s, 10);
  } catch {
    return 0;
  }
};

export const downcase = s => {
  if (!s) {
    return s;
  }

  return s.toLowerCase();
};

// const hideAllButLast = s => {
//   const ll = s[s.length -1];
//   const bs = fill(s.length - 1, '•')
//   return `${bs}${ll}`
// };
//
// const hideAll = s => fill(s.length, '•');
