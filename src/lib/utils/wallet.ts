import { WALLET_TYPES } from 'lib/constants';

export const isExternalWallet = (walletType: symbol) =>
  walletType === WALLET_TYPES.METAMASK ||
  walletType === WALLET_TYPES.WALLET_CONNECT ||
  walletType === WALLET_TYPES.LEDGER ||
  walletType === WALLET_TYPES.TREZOR;
