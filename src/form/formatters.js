import { compose, strSplice } from 'lib/lib';

export const buildFormatter = (formatters = []) =>
  compose(...formatters.reverse());

export const prependSig = s => {
  if (!s || s.length === 0) {
    return s || '';
  }

  return s.charAt(0) === '~' ? s : `~${s}`;
};

/**
 * inserts a - every 7 characters
 * (must be preceeded by prependSig to work correctly)
 * @param {number} maxByteLength the maximum number of patq blocks to have in a string
 */
export const ensurePatQDashes = maxByteLength => s => {
  if (!s || s.length === 0) {
    return s || '';
  }

  // ensure there's a dash every 6 + 1 characters
  const dashAt = i => i * (6 + 1);
  const maxBlocks = maxByteLength / 2;

  for (let i = 1; i !== maxBlocks; i++) {
    const dashIndex = dashAt(i);

    if (s.length - 1 < dashIndex) {
      return s;
    }

    if (s.charAt(dashIndex) !== '-') {
      s = strSplice(s, dashIndex, '-');
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
