import { compose, strSplice } from 'lib/lib';
import { convertToInt } from 'lib/convertToInt';

const HEX_PREFIX = '0x';
const SIG_PREFIX = '~';
const TICKET_MAX_BYTE_LEN = 32; // tickets can be as large as 32 bytes
const PAT_BLOCK_CHAR_LENGTH = 6; // pat{p,q} blocks are 6 characters long

export const buildFormatter = (formatters = []) =>
  compose(...formatters.reverse());

/**
 * inserts a ~ or - before every pat block
 */
export const ensurePatFormat = (s?: string) => {
  // bail if falsy or empty string, nothing to do
  if (!s || s.length === 0) {
    return s || '';
  }

  // ensure there's a dash every 6 + 1 characters
  const dashAt = (i: number) => i * (PAT_BLOCK_CHAR_LENGTH + 1);
  const maxBlocks = TICKET_MAX_BYTE_LEN / 2;

  // for every index that may need a separator
  for (let i = 0; i !== maxBlocks; i++) {
    const dashIndex = dashAt(i);

    // if the string is too short to have a separator here, we're done
    if (s.length - 1 < dashIndex) {
      return s;
    }

    // insert the separator at the correct index if not already there
    const sep = i === 0 ? '~' : '-';
    if (s.charAt(dashIndex) !== sep) {
      s = strSplice(s, dashIndex, sep);
    }
  }

  return s;
};

export const ensureHexPrefix = (s?: string) => {
  if (!s || s.length < HEX_PREFIX.length) {
    return s || '';
  }

  return s.indexOf(HEX_PREFIX) !== 0 ? `${HEX_PREFIX}${s}` : s;
};

export const convertToNumber = (s?: string) => {
  if (!s) {
    return s || '';
  }

  try {
    return convertToInt(s, 10);
  } catch {
    return 0;
  }
};

export const downcase = (s?: string) => {
  if (!s) {
    return s;
  }

  return s.toLowerCase();
};

export const stripHexPrefix = (s?: string) => {
  if (!s) {
    return s;
  }

  return s.toLowerCase().indexOf(HEX_PREFIX) === 0
    ? s.slice(HEX_PREFIX.length)
    : s;
};

export const ensureSigPrefix = (s?: string) => {
  if (!s || s.length < SIG_PREFIX.length) {
    return s || '';
  }

  return s.indexOf(SIG_PREFIX) !== 0 ? `${SIG_PREFIX}${s}` : s;
};

export const stripSigPrefix = (s: string) => {
  if (!s) {
    return s;
  }

  return s.toLowerCase().indexOf(SIG_PREFIX) === 0
    ? s.slice(SIG_PREFIX.length)
    : s;
};

export const ticketToSegments = (ticket: string): string[] => {
  return stripSigPrefix(ticket).split('-');
};

export const ticketFromSegments = (segments: string[]): string => {
  return ensureSigPrefix(segments.join('-'));
};

export const capitalize = (s: string) => {
  if (!s || s === '') {
    return s;
  }

  return s.charAt(0).toUpperCase() + s.slice(1);
};

export const titleize = (s?: string): string => {
  return s
    ? s
        .split(' ')
        .map(_s => capitalize(_s))
        .join(' ')
    : '';
};
