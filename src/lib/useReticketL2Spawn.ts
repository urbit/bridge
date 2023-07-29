import { EthAddress, Ship } from '@urbit/roller-api';
import { useCallback } from 'react';
import Web3 from 'web3';
import { INITIAL_NETWORK_KEY_REVISION } from './constants';
import { reticketPointBetweenWallets } from './reticket';
import BridgeWallet from './types/BridgeWallet';
import { ReticketProgressCallback } from './types/L2Transaction';
import useRoller from './useRoller';
import { registerProxyAddress } from './utils/roller';
import { useWallet } from 'store/wallet';
import { useWalletConnect } from './useWalletConnect';
import { ITxData } from './types/ITxData';

interface ReticketL2SpawnParams {
  fromWallet: BridgeWallet;
  fromWalletType: symbol;
  fromWalletHdPath: string;
  toWallet: UrbitWallet;
  point: Ship;
  web3: Web3;
  contracts: any; // azimuth contracts
  networkType: symbol;
  onUpdate?: ReticketProgressCallback;
  transferEth?: boolean;
  nextRevision: number;
  to: EthAddress;
  txnSigner?: ({
    from,
    to,
    gas,
    gasPrice,
    value,
    data,
    nonce,
  }: ITxData) => Promise<string>;
  txnSender?: ({
    from,
    to,
    gas,
    gasPrice,
    value,
    data,
    nonce,
  }: ITxData) => Promise<string>;
}

/**
 * This hook is used to reticket points that are still on L1 but have the
 * spawn set to L2. It first performs 3-4 L1 transactions (set keys, set
 * management / voting proxy, and transfer).
 *
 * It then sets the spawn proxy using an L2 transaction.
 *
 * Under the hood, it wraps two existing functions:
 * `reticketPointBetweenWallets` for L1, and `registerProxyAddress` for L2.
 *
 */
export const useReticketL2Spawn = () => {
  const { api } = useRoller();
  const { walletType }: any = useWallet();
  const { connector, signPersonalMessage, isConnected } = useWalletConnect();

  const performL2SpawnReticket = useCallback(
    async ({
      fromWallet,
      fromWalletType,
      fromWalletHdPath,
      toWallet,
      point,
      web3,
      contracts,
      networkType,
      onUpdate,
      transferEth = false,
      nextRevision = INITIAL_NETWORK_KEY_REVISION,
      to,
      txnSigner,
      txnSender,
    }: ReticketL2SpawnParams) => {
      // call reticketPointBetweenWallets, with isL2Spawn set to true; this will
      // skip setting the L1 spawn proxy
      await reticketPointBetweenWallets({
        fromWallet,
        fromWalletType,
        fromWalletHdPath,
        toWallet,
        point,
        web3,
        contracts,
        networkType,
        onUpdate,
        transferEth,
        nextRevision,
        txnSigner,
        txnSender,
        doSetSpawnProxy: false,
      });

      // instead, set spawn proxy on L2
      // In most TX sending cases, we would use the fromWallet to sign and send
      // the TX. However, because we are transferring this point during the
      // reticket, we will instead sign the final set spawn proxy TX with the
      // receiving wallet's private key.

      // `registerProxyAddress` expects a toWallet object shaped like a
      // BridgeWallet with `address` and `privateKey` properties.
      const toWalletStub = {
        address: toWallet.ownership.keys.address,
        privateKey: Buffer.from(toWallet.ownership.keys.private, 'hex'),
      };
      const proxy = 'own';
      const nonce = await api.getNonce({ ship: point, proxy });

      await registerProxyAddress(
        api,
        toWalletStub,
        point,
        proxy,
        'spawn',
        nonce,
        toWallet?.spawn?.keys?.address || to,
        walletType,
        web3,
        connector,
        isConnected,
        signPersonalMessage,
        true
      );
    },
    [api, connector, walletType, isConnected, signPersonalMessage]
  );

  return {
    performL2SpawnReticket,
  };
};
