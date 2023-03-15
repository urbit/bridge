import React, {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useState,
  useEffect,
} from 'react';
import { Just, Nothing } from 'folktale/maybe';
import { includes, noop } from 'lodash';
import { randomHex } from 'web3-utils';

import { walletFromMnemonic } from 'lib/wallet';
import {
  DEFAULT_HD_PATH,
  NONCUSTODIAL_WALLETS,
  WALLET_TYPES,
} from 'lib/constants';
import { getAuthToken } from 'lib/authToken';
import { BRIDGE_ERROR } from 'lib/error';

import { useNetwork } from 'store/network';
import { publicToAddress } from 'lib/utils/address';

const initialContext = {
  //
  walletType: Nothing(),
  setWalletType: noop,
  //
  walletHdPath: '',
  setWalletHdPath: noop,
  //
  wallet: Nothing(),
  setWallet: noop,
  //
  urbitWallet: Nothing(),
  setUrbitWallet: noop,
  authMnemonic: Nothing(),
  setAuthMnemonic: noop,
  //
  networkSeed: Nothing(),
  setNetworkSeed: noop,
  networkRevision: Nothing(),
  setNetworkRevision: noop,
  //
  resetWallet: noop,
  //
  authToken: Nothing(),
  setAuthToken: noop,
  useLegacyTokenSigning: Nothing(),
  setUseLegacyTokenSigning: noop,
  skipLoginSigning: false,
  setSkipLoginSigning: noop,
  setFakeToken: noop,
}

export const WalletContext = createContext(initialContext);

const DEFAULT_WALLET_TYPE = WALLET_TYPES.TICKET;

// NB (jtobin):
//
// Note that the 'wallet' prop has type depending on the 'walletType' prop.
// These could be bound together in a single structure (so that
// 'walletType' acted more explicitly as a data constructor of sorts) but
// it doesn't necessarily help us much, since we branch on 'walletType'
// before setting 'wallet'.
//
// Wallets are always wrapped in   For most authentication
// mechanisms, Maybe wraps a BIP32 HD wallet; for Ethereum private keys,
// JSON keystore files, and Metamask authentication, it wraps an
// 'EthereumWallet'.
function _useWallet(initialWallet = Nothing(), initialMnemonic = Nothing()) {
  const [walletType, _setWalletType] = useState(() =>
    initialMnemonic.matchWith({
      Nothing: () => DEFAULT_WALLET_TYPE,
      Just: () => WALLET_TYPES.MNEMONIC,
    })
  );
  const [walletHdPath, setWalletHdPath] = useState(DEFAULT_HD_PATH);
  const [wallet, _setWallet] = useState(initialWallet);
  const [urbitWallet, _setUrbitWallet] = useState(Nothing());
  const [authMnemonic, setAuthMnemonic] = useState(initialMnemonic);
  const [networkSeed, setNetworkSeed] = useState(Nothing());
  const [networkRevision, setNetworkRevision] = useState(Nothing());

  const [authToken, setAuthToken] = useState(Nothing());
  // Allow users to skip signing the auth token on login
  const [skipLoginSigning, setSkipLoginSigning] = useState(false);

  const setFakeToken = () => {
    setAuthToken(Just(randomHex(32)));
  };

  // See: https://github.com/urbit/bridge/issues/549#issuecomment-1048359617
  // This is used for legacy compatibility; this flow should eventually be
  // be removed after ~1 year.
  const [useLegacyTokenSigning, setUseLegacyTokenSigning] = useState(false);

  const { web3 } = useNetwork();

  useEffect(() => {
    (async () => {
      if (
        !Just.hasInstance(wallet) ||
        !Just.hasInstance(web3) ||
        NONCUSTODIAL_WALLETS.has(walletType)
      ) {
        return;
      }

      const _wallet = wallet.value;
      const _web3 = web3.value;
      if (skipLoginSigning) {
        setFakeToken();
        return;
      }

      const token = await getAuthToken({
        wallet: _wallet,
        walletType,
        walletHdPath,
        web3: _web3,
        useLegacyTokenSigning,
      });

      setAuthToken(Just(token));
    })();
  }, [
    wallet,
    walletType,
    walletHdPath,
    web3,
    useLegacyTokenSigning,
    setAuthToken,
    skipLoginSigning,
  ]);

  const setWalletType = useCallback(
    walletType => {
      if (!includes(WALLET_TYPES, walletType)) {
        throw new Error(BRIDGE_ERROR.INVALID_WALLET_TYPE);
      }

      _setWalletType(walletType);
    },
    [_setWalletType]
  );

  const setWallet = useCallback(
    wallet => {
      // force that public addresses are derived for each wallet
      // NOTE wallet is Maybe<> and .map is Maybe#map
      wallet.map(wal => {
        wal.address = wal.address || publicToAddress(wal.publicKey);
        return wal;
      });

      _setWallet(wallet);
    },
    [_setWallet]
  );

  const setUrbitWallet = useCallback(
    urbitWallet => {
      if (Just.hasInstance(urbitWallet)) {
        // when an urbit wallet is set, also derive
        // a normal bip32 wallet using the ownership address
        const wallet = walletFromMnemonic(
          urbitWallet.value.ownership.seed,
          DEFAULT_HD_PATH,
          urbitWallet.value.meta.passphrase
        );

        setWallet(wallet);
      } else {
        setWallet(Nothing());
      }

      _setUrbitWallet(urbitWallet);
    },
    [setWallet]
  );

  const resetWallet = useCallback(() => {
    _setWalletType(DEFAULT_WALLET_TYPE);
    setWalletHdPath(DEFAULT_HD_PATH);
    _setWallet(Nothing());
    _setUrbitWallet(Nothing());
    setAuthMnemonic(Nothing());
    setNetworkSeed(Nothing());
    setNetworkRevision(Nothing());
    setUseLegacyTokenSigning(false);
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
    //
    authToken,
    setAuthToken,
    useLegacyTokenSigning,
    setUseLegacyTokenSigning,
    skipLoginSigning,
    setSkipLoginSigning,
    setFakeToken,
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
