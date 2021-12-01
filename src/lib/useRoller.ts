import { useCallback, useEffect, useMemo, useState } from 'react';
import * as azimuth from 'azimuth-js';
import * as need from 'lib/need';
import SecureLS from 'secure-ls';

import { Invite } from 'lib/types/Invite';
import {
  deriveNetworkSeedFromUrbitWallet,
  attemptNetworkSeedDerivation,
} from 'lib/keys';

import { useNetwork } from 'store/network';
import { usePointCursor } from 'store/pointCursor';
import { EMPTY_POINT, useRollerStore } from 'store/rollerStore';
import { useWallet } from 'store/wallet';
import {
  getStoredInvites,
  setStoredInvite,
  setStoredInvites,
} from 'store/storage/roller';
import { usePointCache } from 'store/pointCache';
import { getOutgoingPoints } from 'views/Points';

import { getUpdatedPointMessage, isPlanet, toL1Details } from './utils/point';
import { convertToInt } from './convertToInt';
import { isDevelopment, isRopsten } from './flags';
import {
  generateInviteWallet,
  getPendingSpawns,
  submitL2Transaction,
  getTimeToNextBatch,
  registerProxyAddress,
  adopt,
  detach,
  reject,
} from './utils/roller';
import { ETH_ZERO_ADDR, ROLLER_HOSTS, TEN_SECONDS } from './constants';

import {
  Config,
  Ship,
  Proxy,
  RollerRPCAPI,
  Options,
  EthAddress,
  UnspawnedPoints,
} from '@urbit/roller-api';

import Point, { PointField, Points } from './types/Point';
import { useTimerStore } from 'store/timerStore';
import { ReticketParams, SendL2Params } from './types/L2Transaction';
import { L1Point } from './types/L1Point';
import { ddmmmYYYY } from './utils/date';
import { useWalletConnect } from './useWalletConnect';

const ONE_SECOND = 1000;

const inviteTemplate = (
  planet: number,
  ticket = '',
  owner = '',
  hash = ''
): Invite => ({
  planet,
  ticket,
  owner,
  hash,
});

export default function useRoller() {
  const {
    wallet,
    authToken,
    authMnemonic,
    urbitWallet,
    walletType,
  }: any = useWallet();
  const { connector } = useWalletConnect();
  const { pointCursor }: any = usePointCursor();
  const { web3, contracts }: any = useNetwork();
  const allPoints: any = usePointCache();
  const controlledPoints = allPoints?.controlledPoints;
  const getDetails = allPoints?.getDetails;

  const { setNextRoll } = useTimerStore();

  const {
    nextBatchTime,
    point,
    points,
    nextQuotaTime,
    removeInvite,
    setNextBatchTime,
    setNextQuotaTime,
    setPendingTransactions,
    setInvites,
    setInviteGeneratingNum,
    setInvitesLoading,
    setModalText,
    setPoints,
    updateInvite,
    updatePoint,
  } = useRollerStore();
  const [config, setConfig] = useState<Config | null>(null);

  const options: Options = useMemo(() => {
    const type = isRopsten || !isDevelopment ? 'https' : 'http';
    const host = isRopsten
      ? ROLLER_HOSTS.ROPSTEN
      : isDevelopment
      ? ROLLER_HOSTS.LOCAL
      : ROLLER_HOSTS.MAINNET;
    const port = isDevelopment && !isRopsten ? 8080 : 443;
    const path = '/v1/roller';

    return {
      transport: {
        type,
        host,
        port,
        path,
      },
    };
  }, []);

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
    getNextQuotaTime(1);
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
        ${config?.rollerQuota} transactions on ${ddmmmYYYY(nextQuotaTime)}.`
      );
    }

    return point.l2Quota <= 0;
  }, [config, nextQuotaTime, point, setModalText]);

  const initPoint = useCallback(
    async (point: string | number) => {
      const _wallet = wallet.getOrElse(null);

      if (!_wallet) {
        return EMPTY_POINT;
      }

      const pointNum = Number(point);
      try {
        const rawDetails = await api.getPoint(pointNum);
        const l2Quota =
          rawDetails?.dominion === 'l2'
            ? await api.getRemainingQuota(pointNum)
            : 0;
        const details = toL1Details(rawDetails);

        return new Point({
          value: pointNum,
          details,
          address: _wallet.address,
          l2Quota,
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

  const checkForUpdates = useCallback(
    async (
      point: number,
      message?: string,
      notify = true,
      field?: PointField
    ) => {
      const interval = setInterval(async () => {
        const updatedPoint = await initPoint(point);
        const changedField = !points[point]
          ? 'newPoint'
          : updatedPoint.getChangedField(points[point], field);

        if (!updatedPoint.isPlaceholder && changedField) {
          console.log('UPDATED', changedField, updatedPoint)
          updatePoint(updatedPoint);
          clearInterval(interval);
          if (Notification?.permission === 'granted' && notify) {
            new Notification(
              `${message || getUpdatedPointMessage(updatedPoint, changedField)}`
            );
          }
        }
      }, TEN_SECONDS);
    },
    [points, initPoint, updatePoint]
  );

  const spawnPoint = useCallback(
    async (pointToSpawn: number) => {
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
        address: _wallet.address,
        wallet: _wallet,
        ship: _point,
        proxy,
        nonce,
        pointToSpawn,
        type: 'spawn',
        walletType,
        web3: _web3,
        connector,
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
    ]
  );

  const generateInviteInfo = async (planet: number, _authToken: string) => {
    const { ticket, inviteWallet } = await generateInviteWallet(
      planet,
      _authToken
    );

    return inviteTemplate(planet, ticket, inviteWallet.ownership.keys.address);
  };

  const getInvites = useCallback(async () => {
    try {
      setInvitesLoading(true);
      const curPoint: number = Number(need.point(pointCursor));
      const _authToken = authToken.getOrElse(null);
      const _contracts = contracts.getOrElse(null);

      if (_authToken && _contracts) {
        const spawnedPoints = point.isL2Spawn
          ? await api.getSpawned(curPoint)
          : [];

        const newPending = await api.getPendingByShip(curPoint);
        setPendingTransactions(newPending);
        const pendingSpawns = getPendingSpawns(newPending);

        const availablePoints = await azimuth.azimuth.getUnspawnedChildren(
          _contracts,
          curPoint
        );

        const outgoingPoints = getOutgoingPoints(
          controlledPoints,
          getDetails
        ).filter((p: number) => isPlanet(p) && availablePoints.includes(p));

        const invitePlanets = spawnedPoints
          .concat(
            outgoingPoints.filter((p: number) => !spawnedPoints.includes(p))
          )
          .filter((p: number) => !pendingSpawns.has(p))
          .sort();

        setInvites(
          curPoint,
          invitePlanets.map(p => inviteTemplate(p))
        );

        const newInvites: Invite[] = [];
        // Iterate over all of the stored invites, generating wallet info as necessary
        const storedInvites = getStoredInvites(ls);

        for (let i = 0; i < invitePlanets.length; i++) {
          setInviteGeneratingNum(i + 1);
          const planet = invitePlanets[i];
          const storedInvite = storedInvites[planet];
          const invite =
            storedInvite || (await generateInviteInfo(planet, _authToken));

          // TODO: check if the invite point's owner still matches the deterministic wallet address
          const planetInfo = await api.getPoint(planet);
          setStoredInvite(ls, invite);

          if (
            invite.owner.toLowerCase() ===
              planetInfo.ownership?.owner?.address ||
            planetInfo.ownership?.transferProxy?.address !== ETH_ZERO_ADDR
          ) {
            newInvites.push(invite);
            updateInvite(curPoint, invite);
          } else {
            removeInvite(curPoint, invite.planet);
          }

          if (storedInvite) {
            setStoredInvite(ls, invite);
          }
        }
        setInvites(curPoint, newInvites);
        setInvitesLoading(false);
        return newInvites;
      }
    } catch (error) {
      console.warn('ERROR GETTING INVITES', error);
    }
  }, [
    api,
    authToken,
    contracts,
    controlledPoints,
    getDetails,
    pointCursor,
    ls,
    point,
    removeInvite,
    setInvites,
    setInvitesLoading,
    setInviteGeneratingNum,
    setPendingTransactions,
    updateInvite,
  ]);

  const generateInviteCodes = useCallback(
    async (numInvites: number) => {
      const _point = need.point(pointCursor);
      const _contracts = contracts.getOrElse(null);
      const _web3 = web3.getOrElse(null);
      const _wallet = wallet.getOrElse(null);
      const _authToken = authToken.getOrElse(null);
      const _details = getDetails(_point);

      if (!_contracts || !_web3 || !_wallet || !_authToken || !_details) {
        // not using need because we want a custom error
        throw new Error('Internal Error: Missing Contracts/Web3/Wallet');
      }

      // TODO: remove when UI disables management proxy from spawning invites
      // if (Just.hasInstance(authMnemonic)) {
      //   throw new Error(
      //     "Auth key Error: A management mnemonic can't create invite codes"
      //   );
      // }
      let planets: UnspawnedPoints = await api.getUnspawned(_point);

      const pendingTxs = await api.getPendingByShip(_point);

      const pendingSpawns = getPendingSpawns(pendingTxs);

      planets = planets.filter((point: number) => !pendingSpawns.has(point));

      const invites: Invite[] = [];

      const proxy = point.getSpawnProxy();

      if (proxy === undefined)
        throw new Error("Error: Address doesn't match proxy");

      const nonce = await api.getNonce({
        ship: _point,
        proxy,
      });

      for (let i = 0; i < numInvites && planets[i]; i++) {
        setInviteGeneratingNum(i + 1);
        const planet = planets[i];
        const nonceInc = i + nonce;

        const { ticket, inviteWallet } = await generateInviteWallet(
          planet,
          _authToken
        );

        await submitL2Transaction({
          api,
          address: _wallet.address,
          wallet: _wallet,
          ship: _point,
          proxy,
          nonce: nonceInc,
          pointToSpawn: planet,
          type: 'spawn',
          walletType,
          web3: _web3,
          connector,
        });

        const networkSeed = await deriveNetworkSeedFromUrbitWallet(
          inviteWallet,
          1
        );
        await submitL2Transaction({
          api,
          wallet: _wallet,
          ship: planet,
          proxy: 'own',
          nonce: 0,
          networkSeed,
          type: 'configureKeys',
          walletType,
          web3: _web3,
          connector,
        });

        await registerProxyAddress(
          api,
          _wallet,
          planet,
          'own',
          'manage',
          1,
          inviteWallet.management.keys.address,
          walletType,
          _web3,
          connector
        );

        await submitL2Transaction({
          api,
          wallet: _wallet,
          ship: planet,
          proxy: 'own',
          type: 'transferPoint',
          nonce: 2,
          address: inviteWallet.ownership.keys.address,
          walletType,
          web3: _web3,
          connector,
        });

        invites.push({
          hash: '',
          ticket,
          planet,
          owner: inviteWallet.ownership.keys.address,
        });
      }

      setStoredInvites(ls, invites);
      getInvites();
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
      getDetails,
      ls,
      getInvites,
      setInviteGeneratingNum,
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

  const configureNetworkingKeys = useCallback(
    async ({ breach, customNetworkSeed }: ConfigureKeysParams) => {
      if (quotaReached()) {
        return;
      }
      const _wallet = wallet.getOrElse(null);
      const _web3 = web3.getOrElse(null);
      const _details = getDetails(point.value);
      if (!_wallet || !_web3 || !_details || point.isDefault) {
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
            details: _details,
            point: point.value,
            authToken,
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
        breach,
      });

      return api.getPendingTx(txHash);
    },
    [// eslint-disable-line
      api,
      authMnemonic,
      authToken,
      point,
      urbitWallet,
      wallet,
      walletType,
      web3,
      getDetails,
      quotaReached,
    ]
  );

  const performL2Reticket = async ({
    point,
    to,
    manager,
    fromWallet,
    toWallet,
  }: ReticketParams) => {
    const azimuthPoint = await api.getPoint(point);
    const proxy = 'own';
    const _web3 = web3.getOrElse(null);
    let nonce = await api.getNonce({ ship: point, proxy });

    let requests = [];

    // 1. Update networking keys
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
    });
    nonce = nonce + 1;
    requests.push(configureKeysRequest);

    // 2. Set Management Proxy
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
      connector
    );
    nonce = nonce + 1;
    requests.push(registerMgmtRequest);

    // 3. Set Spawn Proxy
    if (!isPlanet(Number(point))) {
      const registerSpawnRequest = await registerProxyAddress(
        api,
        fromWallet,
        point,
        proxy,
        'spawn',
        nonce,
        toWallet.spawn.keys.address,
        walletType,
        _web3,
        connector
      );
      nonce = nonce + 1;
      requests.push(registerSpawnRequest);
    }
    // 4. Transfer point
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
    });
    requests.push(transferTxRequest);

    const hashes = await Promise.all(requests);
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
        connector
      );

      return api.getPendingTx(txHash);
    },
    [api, connector, point, wallet, web3, walletType, quotaReached]
  );

  const adoptPoint = useCallback(
    async (ship: Ship) => {
      if (quotaReached()) {
        return;
      }

      const _wallet = wallet.getOrElse(null);

      const proxy = point.getManagerProxy();

      if (proxy === undefined)
        throw new Error("Error: Address doesn't match expected proxy");

      const nonce = await api.getNonce({ ship: point.value, proxy });
      const txHash = await adopt(api, _wallet, point.value, proxy, nonce, ship);

      return api.getPendingTx(txHash);
    },
    [api, point, wallet, quotaReached]
  );

  const kickPoint = useCallback(
    async (ship: Ship) => {
      if (quotaReached()) {
        return;
      }

      if (point.isDefault) {
        throw new Error('Internal Error: point is default');
      }

      const sponsor = point.value;
      const _wallet = wallet.getOrElse(null);
      const proxy = point.getManagerProxy();

      if (proxy === undefined)
        throw new Error("Error: Address doesn't match expected proxy");

      const nonce = await api.getNonce({ ship: sponsor, proxy });
      const txHash = await detach(api, _wallet, sponsor, proxy, nonce, ship);

      return api.getPendingTx(txHash);
    },
    [api, point, wallet, quotaReached]
  );

  const rejectPoint = useCallback(
    async (ship: Ship) => {
      if (quotaReached()) {
        return;
      }

      if (point.isDefault) {
        throw new Error('Internal Error: point is default');
      }

      const sponsor = point.value;
      const _wallet = wallet.getOrElse(null);
      const proxy = point.getManagerProxy();

      if (proxy === undefined)
        throw new Error("Error: Address doesn't match expected proxy");

      const nonce = await api.getNonce({ ship: sponsor, proxy });
      const txHash = await reject(api, _wallet, sponsor, proxy, nonce, ship);

      return api.getPendingTx(txHash);
    },
    [api, point, wallet, quotaReached]
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
        reset,
      });

      return api.getPendingTx(txHash);
    },
    [api, connector, point, pointCursor, wallet, web3, walletType, quotaReached]
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
        ship: point.value,
      });
    },
    [api, connector, point, wallet, web3, walletType, quotaReached]
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

  useEffect(() => {
    const time = isDevelopment ? 10000 : ONE_SECOND;

    const interval = setInterval(() => {
      const nextRoll = getTimeToNextBatch(nextBatchTime, new Date().getTime());
      setNextRoll(nextRoll);

      if (nextBatchTime - ONE_SECOND <= new Date().getTime()) {
        api.getRollerConfig().then(response => {
          setNextBatchTime(response.nextBatch);
        });

        getPendingTransactions();

        setTimeout(() => {
          getPendingTransactions();

          if (!point.isDefault) {
            getInvites();
          }
        }, TEN_SECONDS); // Should this be more like a minute?
      }
    }, time);

    return () => clearInterval(interval);
  }, [point, nextBatchTime, getPendingTransactions, getInvites]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    adoptPoint,
    api,
    changeSponsor,
    checkForUpdates,
    config,
    configureNetworkingKeys,
    generateInviteCodes,
    getInvites,
    getPoints,
    getPointsDetails,
    getPendingTransactions,
    kickPoint,
    ls,
    performL2Reticket,
    rejectPoint,
    setProxyAddress,
    spawnPoint,
    transferPoint,
  };
}
