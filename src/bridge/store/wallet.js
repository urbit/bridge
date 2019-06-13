import React, { createContext, forwardRef, useContext, useState } from 'react';
import Maybe from 'folktale/maybe';
import { includes } from 'lodash';

import {
  WALLET_TYPES,
  DEFAULT_HD_PATH,
  addressFromSecp256k1Public,
} from '../lib/wallet';
import { BRIDGE_ERROR } from '../lib/error';

export const WalletContext = createContext(null);

// NB (jtobin):
//
// Note that the 'wallet' prop has type depending on the 'walletType' prop.
// These could be bound together in a single structure (so that
// 'walletType' acted more explicitly as a data constructor of sorts) but
// it doesn't necessarily help us much, since we branch on 'walletType'
// before setting 'wallet'.
//
// Wallets are always wrapped in Maybe.  For most authentication
// mechanisms, Maybe wraps a BIP32 HD wallet; for Ethereum private keys,
// JSON keystore files, and Metamask authentication, it wraps an
// 'EthereumWallet'.
function _useWallet(initialWallet = Maybe.Nothing()) {
  const [walletType, _setWalletType] = useState(WALLET_TYPES.MNEMONIC);
  const [walletHdPath, setWalletHdPath] = useState(DEFAULT_HD_PATH);
  const [wallet, _setWallet] = useState(initialWallet);

  const setWalletType = walletType => {
    if (!includes(WALLET_TYPES, walletType)) {
      throw BRIDGE_ERROR.INVALID_WALLET_TYPE;
    }

    _setWalletType(walletType);
  };

  const setWallet = wallet => {
    // force that public addresses are derived for each wallet
    wallet.map(wal => {
      wal.address = wal.address || addressFromSecp256k1Public(wal.publicKey);
      return wal;
    });

    _setWallet(wallet);
  };

  return {
    //
    walletType,
    setWalletType,
    //
    walletHdPath,
    setWalletHdPath,
    //
    wallet,
    setWallet,
    //
    // urbitWallet
    // setUrbitWallet
    // authMnemonic
    // setAuthMnemonic
  };
}

export function WalletProvider({ initialWallet, children }) {
  const wallet = _useWallet(initialWallet);

  return (
    <WalletContext.Provider value={wallet}>{children}</WalletContext.Provider>
  );
}

// Hook version
export function useWallet() {
  return useContext(WalletContext);
}

// HOC version
export const withWallet = Component =>
  forwardRef((props, ref) => (
    <WalletContext.Consumer>
      {wallet => <Component ref={ref} {...wallet} {...props} />}
    </WalletContext.Consumer>
  ));
