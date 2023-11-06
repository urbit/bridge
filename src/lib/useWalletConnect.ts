import { SignClient as Connector } from '@walletconnect/sign-client';
import { SignClient } from '@walletconnect/sign-client/dist/types/client';
import { Web3Modal } from '@web3modal/standalone';
import { SessionTypes } from '@walletconnect/types';

import { useEffect, useMemo, useState } from 'react';
import { Just, Nothing } from 'folktale/maybe';

import { useWallet } from 'store/wallet';
import { getAuthToken } from './authToken';
import { WALLET_TYPES } from './constants';
import WalletConnectWallet from './types/WalletConnectWallet';
import { isGoerli } from './flags';
import { ITxData } from './types/ITxData';
import { mayCreateHexString } from './utils/hex';

type PersonalSign = {
  message: string;
  address: string;
};

const getChain = () => {
  return isGoerli ? 'eip155:5' : 'eip155:1';
};

export const useWalletConnect = () => {
  const {
    wallet,
    setWallet,
    setAuthToken,
    setFakeToken,
    skipLoginSigning,
    resetWallet,
  }: any = useWallet();

  const [connector, setConnector] = useState<SignClient | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [session, setSession] = useState<SessionTypes.Struct | null>(null);
  const [modal, setModal] = useState<Web3Modal | null>(null);

  const resetSession = () => {
    setSession(null);
    setAddress(null);
  };

  const updateSession = (_session: SessionTypes.Struct) => {
    setSession(_session);
    setAddress(_session.namespaces.eip155.accounts[0].slice(9));
  };

  const initConnector = async () => {
    if (connector) return;

    const newConnector = await Connector.init({
      projectId: import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID,
    });

    setConnector(newConnector);

    const newModal = new Web3Modal({
      projectId: import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID,
      standaloneChains: [getChain()],
      walletConnectVersion: 2,
    });

    setModal(newModal);

    // restore state from cached connection
    if (Just.hasInstance(wallet) && !session) {
      const cached_sessions = [
        ...newConnector.session.map,
      ].map(([key, value]) => ({ key, value }));

      var restored: SessionTypes.Struct | null = null;

      // this will set restored to the last
      // cached session with the same address
      for (var key in cached_sessions) {
        if (
          cached_sessions[key].value.namespaces.eip155.accounts[0].slice(9) ===
          wallet.value.address
        ) {
          restored = cached_sessions[key].value;
        }
      }

      if (restored) {
        updateSession(restored);
      }
    }
  };

  // Init connector
  useEffect(() => {
    initConnector();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Behavior
  const connect = async () => {
    if (!connector) {
      return;
    }

    const proposalNamespace = {
      eip155: {
        chains: [getChain()],
        methods: [
          'eth_sendTransaction',
          'eth_signTransaction',
          'personal_sign',
        ],
        events: ['connect', 'disconnect'],
      },
    };

    const { uri, approval } = await connector.connect({
      requiredNamespaces: proposalNamespace,
    });

    if (uri) {
      modal?.openModal({ uri });
      const session = await approval();
      updateSession(session);
      modal?.closeModal();
    }
  };

  const disconnect = async () => {
    if (!connector || !session) {
      return;
    }

    await connector.disconnect({
      topic: session.topic,
      reason: { code: 6000, message: 'User disconnected' },
    });

    resetSession();
  };

  const authenticate = async () => {
    if (!(address && connector)) {
      return;
    }

    const wallet: WalletConnectWallet = {
      address,
    };
    setWallet(Just(wallet));

    if (skipLoginSigning) {
      setFakeToken();
      return;
    }
    let authToken = Nothing();

    try {
      const token = await getAuthToken({
        address: address,
        walletType: WALLET_TYPES.WALLET_CONNECT,
        signPersonalMessage: signPersonalMessage,
      });
      authToken = Just(token);
      setAuthToken(authToken);
      modal?.closeModal();
    } catch (e) {
      if (e.message === 'METHOD_NOT_SUPPORTED') {
        console.warn(
          'wallet does not support message signing. proceeding without auth token.'
        );
      } else {
        throw e;
        //TODO  should errors with this *really* prevent login?
      }
    }
  };

  const isConnected = () => {
    if (!connector || !session) {
      return false;
    }

    return session?.acknowledged;
  };

  const peerIcon = useMemo(() => {
    if (!session?.peer?.metadata?.icons) {
      return null;
    }

    // Some peers return a list of empty string(s) :)
    const iconCandidates = session?.peer?.metadata?.icons.filter(
      pm => pm !== ''
    );

    return iconCandidates.length > 0 ? iconCandidates[0] : null;
  }, [session]);

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

      // Ledger Live needs to use fakeSign instead since it sends the txn upon signing
      if (session?.peer?.metadata?.name === 'Ledger Wallet') {
        reject(new Error('METHOD_NOT_SUPPORTED'));
        return;
      }

      return connector
        .request<string>({
          topic: session?.topic!,
          chainId: getChain(),
          request: {
            method: 'eth_signTransaction',
            params: [
              {
                to,
                from,
                data: mayCreateHexString(data),
                nonce: mayCreateHexString(nonce),
                gasPrice: mayCreateHexString(gasPrice),
                gasLimit: mayCreateHexString(gas),
                value: mayCreateHexString(value),
              },
            ],
          },
        })
        .then((signature: string) => resolve(signature))
        .catch((error: Error) => reject(error));
    });
  };

  const sendTransaction = async ({
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
        reject(new Error('No connected wallet available for sending'));
        return;
      }

      return connector
        .request<string>({
          topic: session?.topic!,
          chainId: getChain(),
          request: {
            method: 'eth_sendTransaction',
            params: [
              {
                to,
                from,
                data: mayCreateHexString(data),
                nonce: mayCreateHexString(nonce),
                gasPrice: mayCreateHexString(gasPrice),
                gasLimit: mayCreateHexString(gas),
                value: mayCreateHexString(value),
              },
            ],
          },
        })
        .then((txHash: string) => resolve(txHash))
        .catch((error: Error) => reject(error));
    });
  };

  const signPersonalMessage = async ({ message, address }: PersonalSign) => {
    return new Promise((resolve, reject) => {
      if (!connector || !isConnected()) {
        reject(new Error('No connected wallet available for signing'));
        return;
      }

      return connector
        .request({
          topic: session?.topic!,
          chainId: getChain(),
          request: {
            method: 'personal_sign',
            params: [mayCreateHexString(message), address],
          },
        })
        .then(result => {
          resolve(result);
        })
        .catch((error: Error) => reject(error));
    });
  };

  // Event handlers

  const onSessionDelete = () => {
    resetSession();
    resetWallet();
  };

  const onSessionUpdate = ({ topic, params }: any) => {
    const _session = connector?.session.get(topic);
    if (_session) {
      updateSession(_session);
    }
  };

  // Init and clean up
  useEffect(() => {
    if (!connector) {
      return;
    }
    connector.on('session_delete', onSessionDelete);
    connector.on('session_update', onSessionUpdate);

    return () => {
      // Clean up listeners
      connector.off('session_delete', onSessionDelete);
      connector.off('session_update', onSessionUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connector]);

  return {
    address,
    authenticate,
    connect,
    connector,
    session,
    disconnect,
    isConnected,
    peerIcon,
    initConnector,
    signTransaction,
    sendTransaction,
    signPersonalMessage,
  };
};
