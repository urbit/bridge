import React, {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useState,
} from 'react';
import Maybe from 'folktale/maybe';
import { includes } from 'lodash';

import {
  WALLET_TYPES,
  DEFAULT_HD_PATH,
  addressFromSecp256k1Public,
  walletFromMnemonic,
} from 'lib/wallet';
import { BRIDGE_ERROR } from 'lib/error';

export const WalletContext = createContext(null);

const DEFAULT_WALLET_TYPE = WALLET_TYPES.TICKET;

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
function _useWallet(
  initialWallet = Maybe.Nothing(),
  initialMnemonic = Maybe.Nothing()
) {
  const [walletType, _setWalletType] = useState(DEFAULT_WALLET_TYPE);
  const [walletHdPath, setWalletHdPath] = useState(DEFAULT_HD_PATH);
  const [wallet, _setWallet] = useState(initialWallet);
  const [urbitWallet, _setUrbitWallet] = useState(Maybe.Nothing());
  const [authMnemonic, setAuthMnemonic] = useState(initialMnemonic);
  const [networkSeed, setNetworkSeed] = useState(Maybe.Nothing());
  const [networkRevision, setNetworkRevision] = useState(Maybe.Nothing());

  const setWalletType = useCallback(
    walletType => {
      if (!includes(WALLET_TYPES, walletType)) {
        throw BRIDGE_ERROR.INVALID_WALLET_TYPE;
      }

      _setWalletType(walletType);
    },
    [_setWalletType]
  );

  const setWallet = useCallback(
    wallet => {
      // force that public addresses are derived for each wallet
      wallet.map(wal => {
        wal.address = wal.address || addressFromSecp256k1Public(wal.publicKey);
        return wal;
      });

      _setWallet(wallet);
    },
    [_setWallet]
  );

  const setUrbitWallet = useCallback(
    urbitWallet => {
      if (Maybe.Just.hasInstance(urbitWallet)) {
        // when an urbit wallet is set, also derive
        // a normal bip32 wallet using the ownership address
        const wallet = walletFromMnemonic(
          urbitWallet.value.ownership.seed,
          DEFAULT_HD_PATH,
          urbitWallet.value.meta.passphrase
        );

        setWallet(wallet);
      } else {
        setWallet(Maybe.Nothing());
      }

      _setUrbitWallet(urbitWallet);
    },
    [setWallet]
  );

  const resetWallet = useCallback(() => {
    _setWalletType(DEFAULT_WALLET_TYPE);
    setWalletHdPath(DEFAULT_HD_PATH);
    _setWallet(Maybe.Nothing());
    _setUrbitWallet(Maybe.Nothing());
    setAuthMnemonic(Maybe.Nothing());
    setNetworkSeed(Maybe.Nothing());
    setNetworkRevision(Maybe.Nothing());
  }, [
    _setWalletType,
    setWalletHdPath,
    _setWallet,
    _setUrbitWallet,
    setAuthMnemonic,
    setNetworkSeed,
    setNetworkRevision,
  ]);

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
    urbitWallet,
    setUrbitWallet,
    authMnemonic,
    setAuthMnemonic,
    //
    networkSeed,
    setNetworkSeed,
    networkRevision,
    setNetworkRevision,
    //
    resetWallet,
  };
}

export function WalletProvider({ initialWallet, initialMnemonic, children }) {
  const wallet = _useWallet(initialWallet, initialMnemonic);

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
