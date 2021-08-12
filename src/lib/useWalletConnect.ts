import WalletConnect from '@walletconnect/client';
import QRCodeModal from '@walletconnect/qrcode-modal';
import { ITxData } from '@walletconnect/types';

import { useEffect, useState } from 'react';
import { Just } from 'folktale/maybe';

import { useWallet } from 'store/wallet';
import { getAuthToken } from './authToken';
import { WALLET_TYPES } from './constants';
import WalletConnectWallet from './types/WalletConnectWallet';

type PeerMeta = {
  description: string;
  icons?: string[];
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
  const { setWallet, setAuthToken, resetWallet } = useWallet();
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
  const connect = async () => {
    if (!connector || connector.connected) {
      return;
    }

    await connector.createSession();
  };

  const disconnect = async () => {
    if (!connector) {
      return;
    }

    await connector.killSession();
  };

  const authenticate = async () => {
    if (!(address && connector)) {
      return;
    }

    const authToken = await getAuthToken({
      address,
      connector,
      walletType: WALLET_TYPES.WALLET_CONNECT,
    });

    const wallet: WalletConnectWallet = {
      address,
    };

    setAuthToken(Just(authToken));
    setWallet(Just(wallet));
  };

  const isConnected = () => {
    if (!connector) {
      return false;
    }

    return connector.connected;
  };

  const signTransaction = async ({
    from,
    to,
    gas,
    gasPrice,
    value,
    data,
    nonce,
  }: ITxData): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!connector || !isConnected()) {
        reject(new Error('No connected wallet available for signing'));
        return;
      }

      return connector
        .signTransaction({
          from,
          to,
          gas,
          gasPrice,
          value,
          data,
          nonce,
        })
        .then((txHash: string) => resolve(txHash))
        .catch((error: Error) => reject(error));
    });
  };

  // Event Handlers
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
      connector.off('modal_closed');
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
    signTransaction,
  };
};
