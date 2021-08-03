import WalletConnect from '@walletconnect/client';
import QRCodeModal from '@walletconnect/qrcode-modal';
import { useEffect, useState } from 'react';
import { Just } from 'folktale/maybe';

import { useWallet } from 'store/wallet';
import { getAuthToken } from './authToken';
import { DEFAULT_HD_PATH, WALLET_TYPES } from './constants';
import WalletConnectWallet from './types/WalletConnectWallet';

type PeerMeta = {
  description: string;
  icons: string[];
  name: string;
  url: string;
};

type ConnectEvent = {
  event: 'connect';
  params: [
    {
      accounts: string[];
      chainId: number;
      peerId: string;
      peerMeta: PeerMeta;
    }
  ];
};

export const useWalletConnect = () => {
  const { setWallet, setWalletHdPath, setAuthToken, resetWallet } = useWallet();
  const [connector, setConnector] = useState<WalletConnect | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [peerMeta, setPeerMeta] = useState<PeerMeta | null>(null);

  const resetConnector = () => {
    const newConnector = new WalletConnect({
      bridge: 'https://bridge.walletconnect.org',
      qrcodeModal: QRCodeModal,
    });

    setConnector(newConnector);

    // restore state from cached connection
    if (newConnector.accounts.length > 0) {
      setAddress(newConnector.accounts[0]);
    }

    if (newConnector.peerMeta) {
      setPeerMeta(newConnector.peerMeta);
    }
  };

  // Init connector
  useEffect(() => {
    resetConnector();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Behavior
  const connect = () => {
    if (!connector || connector.connected) {
      return;
    }

    connector.createSession();
  };

  const disconnect = async () => {
    if (!connector) {
      return;
    }

    await connector.killSession();
  };

  type AuthenticateArgs = {
    hdPath?: string;
  };

  const authenticate = async ({
    hdPath = DEFAULT_HD_PATH,
  }: AuthenticateArgs) => {
    if (!(address && connector)) {
      return;
    }

    const authToken = await getAuthToken({
      address,
      connector,
      walletType: WALLET_TYPES.WALLET_CONNECT,
    });

    // Inspired by the MetamaskWallet implementation :)
    // TODO: We should refactor / unify how we handle wallets
    const wallet: WalletConnectWallet = {
      address,
    };

    setAuthToken(Just(authToken));
    setWallet(Just(wallet));
    setWalletHdPath(hdPath);
  };

  const isConnected = () => {
    if (!connector) {
      return false;
    }

    return connector.connected;
  };

  const initConnectHandler = () => {
    if (!connector) {
      return;
    }

    connector.on('connect', async (error, payload: ConnectEvent) => {
      if (error) {
        throw error;
      }

      const address = payload.params[0].accounts[0];
      setAddress(address);
      setPeerMeta(payload.params[0].peerMeta);
    });
  };

  const initDisconnectHandler = () => {
    if (!connector) {
      return;
    }

    connector.on('disconnect', (error, _payload) => {
      if (error) {
        throw error;
      }

      setAddress(null);
      setPeerMeta(null);
      resetWallet();
    });
  };

  const initSessionUpdateHandler = () => {
    if (!connector) {
      return;
    }

    connector.on('session_update', (error, payload) => {
      if (error) {
        throw error;
      }

      // TODO: Confirm what should happen on update?
      // For now, disconnect and logout
      disconnect();
    });
  };

  const initModalClosedHandler = () => {
    if (!connector) {
      return;
    }

    connector.on('modal_closed', () => {
      resetWallet();
      resetConnector();
    });
  };

  // Init and clean up
  useEffect(() => {
    if (!connector) {
      return;
    }

    initConnectHandler();
    initDisconnectHandler();
    initSessionUpdateHandler();
    initModalClosedHandler();

    return () => {
      // Clean up listeners
      connector.off('connect');
      connector.off('disconnect');
      connector.off('session_update');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connector]);

  return {
    address,
    authenticate,
    connect,
    connector,
    disconnect,
    isConnected,
    peerMeta,
    resetConnector,
  };
};
