import { keccak256 } from 'web3-utils';
import { isAddress } from 'web3-utils';

export const stripHexPrefix = (hex: string) => {
  return hex.startsWith('0x') ? hex.slice(2) : hex;
};

export const addHexPrefix = (hex: string) => {
  return hex.startsWith('0x') ? hex : `0x${hex}`;
};

export const isValidAddress = a => '0x0' === a || isAddress(a);

export const abbreviateAddress = address =>
  `${address.slice(0, 6)}…${address.slice(-4)}`;

export const isZeroAddress = a =>
  a === ETH_ZERO_ADDR || a === ETH_ZERO_ADDR_SHORT;

export const toChecksumAddress = address => {
  const addr = stripHexPrefix(address).toLowerCase();
  const hash = keccak256(addr).toString('hex');

  return reduce(
    addr,
    (acc, char, idx) =>
      parseInt(hash[idx], 16) >= 8 ? acc + char.toUpperCase() : acc + char,
    '0x'
  );
};

export const eqAddr = (addr0, addr1) =>
  toChecksumAddress(addr0) === toChecksumAddress(addr1);
