import { useCallback, useEffect, useMemo, useState } from 'react';
import * as azimuth from 'azimuth-js';
import * as need from 'lib/need';
import SecureLS from 'secure-ls';

import {
  deriveNetworkSeedFromUrbitWallet,
  attemptNetworkSeedDerivation,
} from 'lib/keys';

import { useNetwork } from 'store/network';
import { usePointCursor } from 'store/pointCursor';
import { EMPTY_POINT, useRollerStore } from 'store/rollerStore';
import { useWallet } from 'store/wallet';

import { getUpdatedPointMessage, isPlanet, toL1Details } from './utils/point';
import { convertToInt } from './convertToInt';
import { isDevelopment } from './flags';
import {
  submitL2Transaction,
  registerProxyAddress,
  isL2Spawn,
} from './utils/roller';
import { TEN_SECONDS } from './constants';

import {
  Config,
  Ship,
  Proxy,
  RollerRPCAPI,
  EthAddress,
} from '@urbit/roller-api';

import Point, { PointField, Points } from './types/Point';
import { ReticketParams, SendL2Params } from './types/L2Transaction';
import { L1Point } from './types/L1Point';
import { ddmmmYYYY } from './utils/date';
import { showNotification } from './utils/notifications';
import { useWalletConnect } from './useWalletConnect';
import { PendingL1Txn } from './types/PendingL1Transaction';
import { TRANSACTION_PROGRESS } from './reticket';
import { useRollerOptions } from './useRollerOptions';
import { useTimerStore } from 'store/timerStore';

interface UpdateParams {
  point?: Point | number;
  message?: string;
  notify?: boolean;
  field?: PointField;
  l1Txn?: PendingL1Txn;
  intervalTime?: number;
}

export default function useRoller() {
  const {
    wallet,
    authToken,
    authMnemonic,
    urbitWallet,
    walletType,
  }: any = useWallet();
  const { connector, isConnected, signPersonalMessage } = useWalletConnect();
  const { pointCursor }: any = usePointCursor();
  const { web3, contracts }: any = useNetwork();

  const {
    point,
    points,
    nextQuotaTime,
    setNextQuotaTime,
    setPendingTransactions,
    setModalText,
    setPoints,
    updatePoint,
    storePendingL1Txn,
    deletePendingL1Txn,
  } = useRollerStore();
  const { setNextBatchTime } = useTimerStore();
  const [config, setConfig] = useState<Config | null>(null);

  const { options } = useRollerOptions();

  const api = useMemo(() => {
    return new RollerRPCAPI(options);
  }, [options]);

  const ls = useMemo(
    () =>
      new SecureLS({
        isCompression: false,
        encryptionSecret: authToken.getOrElse('default'),
      }),
    [authToken]
  );

  const getNextQuotaTime = useCallback(
    (nextSlice: number) => {
      setTimeout(() => {
        api
          .whenNextSlice()
          .then(next => {
            setNextQuotaTime(next);
            getNextQuotaTime(next);
          })
          .catch(err => console.warn(err));
      }, nextSlice - new Date().getTime());
    },
    [api, setNextQuotaTime]
  );

  const fetchConfig = useCallback(async () => {
    getNextQuotaTime(Date.now() + 1000);
    api
      .getRollerConfig()
      .then(config => {
        setConfig(config);
        setNextBatchTime(config.nextBatch);
      })
      .catch(err => {
        // TODO: more elegant error handling
        console.warn(
          '[fetchConfig:failed] check the roller connection?\n',
          err
        );
      });
  }, [api, getNextQuotaTime, setNextBatchTime]);

  const quotaReached = useCallback(() => {
    if (point.l2Quota <= 0) {
      setModalText(
        `You have reached your weekly L2 transaction limit. You will get another
        ${point.l2Allowance} transactions on ${ddmmmYYYY(nextQuotaTime)}.`
      );
    }

    return point.l2Quota <= 0;
  }, [nextQuotaTime, point, setModalText]);

  const initPoint = useCallback(
    async (point: string | number): Promise<Point> => {
      const _wallet = wallet.getOrElse(null);
      const _contracts = contracts.getOrElse(null);

      if (!_wallet || !_contracts) {
        return EMPTY_POINT;
      }

      const pointNum = Number(point);
      try {
        const rawDetails = await api.getPoint(pointNum);
        const isL2 = isL2Spawn(rawDetails?.dominion);
        const l2Quota = isL2 ? await api.getRemainingQuota(pointNum) : 0;
        const l2Allowance = isL2 ? await api.getAllowance(pointNum) : 0;

        const details = isL2Spawn(rawDetails?.dominion)
          ? toL1Details(rawDetails)
          : await azimuth.azimuth.getPoint(_contracts, point);

        return new Point({
          value: pointNum,
          details,
          address: _wallet.address,
          l2Quota,
          l2Allowance,
        });
      } catch (e) {
        console.warn(e);

        // Try getting the details from L1
        try {
          const _contracts = need.contracts(contracts);
          const details = await azimuth.azimuth.getPoint(_contracts, point);
          return new Point({
            value: pointNum,
            details,
            address: _wallet.address,
          });
        } catch (e) {
          console.warn(e);
          // Just return a placeholder Point
          const details: L1Point = toL1Details();
          return new Point({
            value: pointNum,
            details,
            address: _wallet.address,
            isPlaceholder: true,
          });
        }
      }
    },
    [api, wallet, contracts]
  );

  const getAndUpdatePoint = useCallback(
    async (point: number) => {
      const updatedPoint = await initPoint(point);
      updatePoint(updatedPoint);
    },
    [initPoint, updatePoint]
  );

  const checkForUpdates = useCallback(
    async ({
      point,
      message,
      notify = true,
      field,
      l1Txn,
      intervalTime = TEN_SECONDS,
    }: UpdateParams) => {
      const pVal = typeof point === 'number' ? point : point.value;
      const p = await initPoint(pVal);

      if (l1Txn) storePendingL1Txn(l1Txn);

      let interval: any;
      const check = async () => {
        const changedField = !points[p.value]
          ? 'newPoint'
          : p.getChangedField(points[p.value], field);

        if (isDevelopment) {
          console.log(`CHECKING FOR ${changedField} UPDATES:`, p.patp);
        }

        if (!p.isPlaceholder && changedField) {
          updatePoint(p);
          if (interval) {
            clearInterval(interval);
          }

          if (l1Txn) deletePendingL1Txn(l1Txn);
          if (notify) {
            showNotification(
              `${message || getUpdatedPointMessage(p, changedField)}`
            );
          }
        }
      };

      interval = setInterval(check, intervalTime);
      check();
    },
    [points, initPoint, updatePoint, storePendingL1Txn, deletePendingL1Txn]
  );

  const spawnPoint = useCallback(
    async (pointToSpawn: number, destinationAddress: string) => {
      if (quotaReached()) {
        return;
      }

      const _point = need.point(pointCursor);
      const _contracts = contracts.getOrElse(null);
      const _web3 = web3.getOrElse(null);
      const _wallet = wallet.getOrElse(null);
      const _authToken = authToken.getOrElse(null);

      if (!_contracts || !_web3 || !_wallet || !_authToken) {
        // not using need because we want a custom error
        throw new Error('Internal Error: Missing Contracts/Web3/Wallet');
      }

      const proxy = point.getSpawnProxy();

      if (proxy === undefined)
        throw new Error("Error: Address doesn't match proxy");

      const nonce = await api.getNonce({
        ship: _point,
        proxy,
      });

      await submitL2Transaction({
        api,
        address: destinationAddress,
        wallet: _wallet,
        ship: _point,
        proxy,
        nonce,
        pointToSpawn,
        type: 'spawn',
        walletType,
        web3: _web3,
        connector,
        isConnected,
        signPersonalMessage,
      });
    },
    [
      api,
      authToken,
      connector,
      contracts,
      pointCursor,
      point,
      wallet,
      walletType,
      web3,
      quotaReached,
      signPersonalMessage,
      isConnected,
    ]
  );

  const getPoints = useCallback(
    async (proxy: Proxy, address: EthAddress) => {
      const points: Ship[] =
        proxy === 'own'
          ? await api.getOwnedPoints(address)
          : proxy === 'manage'
            ? await api.getManagerFor(address)
            : proxy === 'vote'
              ? await api.getVotingFor(address)
              : proxy === 'transfer'
                ? await api.getTransferringFor(address)
                : proxy === 'spawn'
                  ? await api.getSpawningFor(address)
                  : [];

      return points;
    },
    [api]
  );

  const getPendingTransactions = useCallback(async () => {
    try {
      if (!point.isDefault) {
        const newPending = await api.getPendingByShip(point.value);
        setPendingTransactions(newPending);
      }
    } catch (error) {
      console.warn('ERROR GETTING PENDING', error);
    }
  }, [api, setPendingTransactions, point]);

  interface ConfigureKeysParams {
    breach: boolean;
    customNetworkSeed?: string;
  }

  const configureNetworkKeys = useCallback(
    async ({ breach, customNetworkSeed }: ConfigureKeysParams) => {
      if (quotaReached()) {
        return;
      }
      const _wallet = wallet.getOrElse(null);
      const _web3 = web3.getOrElse(null);
      if (!_wallet || !_web3 || point.isDefault) {
        // not using need because we want a custom error
        throw new Error('Internal Error: Missing Wallet/Details');
      }

      const proxy = point.getManagerProxy();

      if (proxy === undefined)
        throw new Error("Error: Address doesn't match proxy");

      const nonce = await api.getNonce({
        ship: point.value,
        proxy,
      });

      const nextRevision = point.keyRevisionNumber + 1;
      const networkSeed = customNetworkSeed
        ? customNetworkSeed
        : await attemptNetworkSeedDerivation({
          urbitWallet,
          wallet,
          authMnemonic,
          details: point,
          authToken,
          point: point.value,
          revision: nextRevision,
        });
      const txHash = await submitL2Transaction({
        api,
        wallet: _wallet,
        ship: point.value,
        proxy,
        nonce,
        networkSeed,
        type: 'configureKeys',
        walletType,
        web3: _web3,
        connector,
        isConnected,
        signPersonalMessage,
        breach,
      });

      return api.getPendingTx(txHash);
    },
    [
      // eslint-disable-line
      api,
      authMnemonic,
      authToken,
      point,
      urbitWallet,
      wallet,
      walletType,
      web3,
      quotaReached,
      connector,
      isConnected,
      signPersonalMessage,
    ]
  );

  const performL2Reticket = async ({
    point,
    to,
    manager,
    fromWallet,
    toWallet,
    onUpdate,
  }: ReticketParams) => {
    const azimuthPoint = await api.getPoint(point);
    const proxy = 'own';
    const _web3 = web3.getOrElse(null);
    let nonce = await api.getNonce({ ship: point, proxy });
    const progress = onUpdate
      ? (state: number) => onUpdate({ type: 'progress', state })
      : () => { };

    let requests = [];

    // 1. Update networking keys
    progress(TRANSACTION_PROGRESS.GENERATING);
    const networkRevision = convertToInt(azimuthPoint.network.keys.life, 10);
    const nextRevision = networkRevision + 1;
    const networkSeed = await deriveNetworkSeedFromUrbitWallet(
      toWallet,
      nextRevision
    );
    const configureKeysRequest = await submitL2Transaction({
      api,
      wallet: fromWallet,
      ship: point,
      proxy,
      nonce,
      networkSeed,
      walletType,
      type: 'configureKeys',
      web3: _web3,
      connector,
      signPersonalMessage,
      isConnected,
    });
    nonce = nonce + 1;
    requests.push(configureKeysRequest);

    // 2. Set Management Proxy
    progress(TRANSACTION_PROGRESS.SIGNING);
    const registerMgmtRequest = await registerProxyAddress(
      api,
      fromWallet,
      point,
      proxy,
      'manage',
      nonce,
      manager,
      walletType,
      _web3,
      connector,
      signPersonalMessage,
      isConnected
    );
    nonce = nonce + 1;
    requests.push(registerMgmtRequest);

    // 3. Set Spawn Proxy
    progress(TRANSACTION_PROGRESS.FUNDING);
    if (!isPlanet(Number(point))) {
      const registerSpawnRequest = await registerProxyAddress(
        api,
        fromWallet,
        point,
        proxy,
        'spawn',
        nonce,
        toWallet?.spawn?.keys?.address || to,
        walletType,
        _web3,
        connector,
        signPersonalMessage,
        isConnected
      );
      nonce = nonce + 1;
      requests.push(registerSpawnRequest);
    }

    // 4. Transfer point
    progress(TRANSACTION_PROGRESS.TRANSFERRING);
    const transferTxRequest = await submitL2Transaction({
      api,
      wallet: fromWallet,
      ship: point,
      proxy: 'own',
      type: 'transferPoint',
      nonce,
      address: to,
      walletType,
      web3: _web3,
      connector,
      signPersonalMessage,
      isConnected,
    });
    requests.push(transferTxRequest);

    progress(TRANSACTION_PROGRESS.CLEANING);
    const hashes = await Promise.all(requests);

    progress(TRANSACTION_PROGRESS.DONE);
    return hashes;
  };

  const setProxyAddress = useCallback(
    async (proxyType: Proxy, address: EthAddress) => {
      if (quotaReached()) {
        return;
      }
      const _wallet = wallet.getOrElse(null);
      const _web3 = web3.getOrElse(null);

      if (!_wallet) {
        // not using need because we want a custom error
        throw new Error('Internal Error: Missing Wallet');
      }

      if (point.isDefault) {
        // not using need because we want a custom error
        throw new Error('Internal Error: Invalid point');
      }
      const proxy = point.getAddressProxy(proxyType);

      if (proxy === undefined)
        throw new Error("Error: Address doesn't match expected proxy");

      const nonce = await api.getNonce({ ship: point.value, proxy });
      const txHash = await registerProxyAddress(
        api,
        _wallet,
        point.value,
        proxy,
        proxyType,
        nonce,
        address,
        walletType,
        _web3,
        connector,
        signPersonalMessage,
        isConnected
      );
      return api.getPendingTx(txHash);
    },
    [
      api,
      connector,
      signPersonalMessage,
      isConnected,
      point,
      wallet,
      web3,
      walletType,
      quotaReached,
    ]
  );

  const changeSponsorship = useCallback(
    async (
      sponsee: Ship,
      type: 'adopt' | 'detach' | 'reject',
      skipQuotaCheck = false
    ) => {
      if (!skipQuotaCheck && quotaReached()) {
        return;
      }

      const _wallet = wallet.getOrElse(null);
      const _web3 = web3.getOrElse(null);
      const ship = point.value;

      const proxy = point.getManagerProxy();

      if (proxy === undefined)
        throw new Error("Error: Address doesn't match expected proxy");

      const nonce = await api.getNonce({ ship, proxy });
      // const txHash = await adopt(api, _wallet, point.value, proxy, nonce, ship);
      const txHash = await submitL2Transaction({
        api,
        wallet: _wallet,
        ship,
        sponsee,
        proxy,
        nonce,
        address: _wallet.address,
        type,
        walletType,
        web3: _web3,
        connector,
        signPersonalMessage,
        isConnected,
      });

      return api.getPendingTx(txHash);
    },
    [
      api,
      point,
      wallet,
      walletType,
      web3,
      connector,
      quotaReached,
      isConnected,
      signPersonalMessage,
    ]
  );

  const transferPoint = useCallback(
    async (address: EthAddress, reset?: boolean) => {
      if (quotaReached()) {
        return;
      }

      const _point = need.point(pointCursor);
      const _wallet = wallet.getOrElse(null);
      const _web3 = web3.getOrElse(null);

      if (!_wallet) {
        // not using need because we want a custom error
        throw new Error('Internal Error: Missing Wallet');
      }

      const proxy = point.getTransferProxy();

      if (proxy === undefined)
        throw new Error("Error: Address doesn't match proxy");

      const nonce = await api.getNonce({ ship: _point, proxy });

      const txHash = await submitL2Transaction({
        api,
        wallet: _wallet,
        ship: _point,
        proxy,
        nonce,
        address,
        type: 'transferPoint',
        walletType,
        web3: _web3,
        connector,
        signPersonalMessage,
        isConnected,
        reset,
      });

      return api.getPendingTx(txHash);
    },
    [
      api,
      connector,
      point,
      pointCursor,
      wallet,
      web3,
      walletType,
      quotaReached,
      isConnected,
      signPersonalMessage,
    ]
  );

  const sendL2Transaction = useCallback(
    async (params: SendL2Params) => {
      if (quotaReached()) {
        return;
      }

      const _wallet = wallet.getOrElse(null);
      const _web3 = web3.getOrElse(null);

      if (!_wallet || point.isDefault) {
        // not using need because we want a custom error
        throw new Error('Internal Error: Missing Wallet or Point Info');
      }

      return submitL2Transaction({
        ...params,
        api,
        wallet: _wallet,
        walletType,
        web3: _web3,
        connector,
        signPersonalMessage,
        isConnected,
        ship: point.value,
      });
    },
    [
      api,
      connector,
      point,
      wallet,
      web3,
      walletType,
      quotaReached,
      isConnected,
      signPersonalMessage,
    ]
  );

  const changeSponsor = useCallback(
    async (newSponsor: number) => {
      if (point.isDefault) {
        throw new Error('Internal Error: point is default');
      }

      const curPoint = point.value;
      const _wallet = wallet.getOrElse(null);

      if (!_wallet) {
        // not using need because we want a custom error
        throw new Error('Internal Error: Missing Wallet');
      }

      const proxy = point.getManagerProxy();

      if (proxy === undefined)
        throw new Error("Error: Address doesn't match proxy");

      const nonce = await api.getNonce({ ship: curPoint, proxy });

      return sendL2Transaction({
        newSponsor,
        nonce,
        proxy,
        type: 'escape',
        ship: curPoint,
      });
    },
    [api, point, sendL2Transaction, wallet]
  );

  const cancelEscape = useCallback(async () => {
    if (point.isDefault) {
      throw new Error('Internal Error: point is default');
    }

    const curPoint = point.value;
    const _wallet = wallet.getOrElse(null);

    if (!_wallet) {
      // not using need because we want a custom error
      throw new Error('Internal Error: Missing Wallet');
    }

    const proxy = point.getManagerProxy();

    if (proxy === undefined)
      throw new Error("Error: Address doesn't match proxy");

    const nonce = await api.getNonce({ ship: curPoint, proxy });

    return sendL2Transaction({
      nonce,
      proxy,
      type: 'cancelEscape',
      ship: curPoint,
    });
  }, [api, point, sendL2Transaction, wallet]);

  const getPointsDetails = useCallback(
    async (
      ownedPoints: number[],
      incomingPoints: number[],
      managingPoints: number[],
      votingPoints: number[],
      spawningPoints: number[]
    ) => {
      try {
        const allPoints = [
          await Promise.all(ownedPoints.map(initPoint)),
          await Promise.all(incomingPoints.map(initPoint)),
          await Promise.all(managingPoints.map(initPoint)),
          await Promise.all(votingPoints.map(initPoint)),
          await Promise.all(spawningPoints.map(initPoint)),
        ];

        setPoints(
          allPoints.reduce((acc: Points, cur: (Point | undefined)[]) => {
            cur.forEach(p => {
              if (p) {
                acc[p.value] = p;
              }
            });
            return acc;
          }, {})
        );
      } catch (e) {
        console.warn(e);
      }
    },
    [setPoints, initPoint]
  );

  // On load, get initial config
  useEffect(() => {
    if (config) {
      return;
    }

    fetchConfig();
  }, [config, fetchConfig]);

  return {
    api,
    changeSponsorship,
    changeSponsor,
    cancelEscape,
    checkForUpdates,
    config,
    configureNetworkKeys,
    getAndUpdatePoint,
    getPoints,
    getPointsDetails,
    getPendingTransactions,
    initPoint,
    ls,
    performL2Reticket,
    setProxyAddress,
    spawnPoint,
    transferPoint,
  };
}
