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
import { getStoredInvites, setStoredInvites } from 'store/storage/roller';
import { usePointCache } from 'store/pointCache';
import { getOutgoingPoints } from 'views/Points';

import {
  getSpawnProxy,
  getManagerProxy,
  getAddressProxy,
  getTransferProxy,
} from './utils/proxy';
import { isPlanet, toL1Details } from './utils/point';
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
import { ROLLER_HOSTS } from './constants';

import {
  Config,
  Ship,
  Proxy,
  RollerRPCAPI,
  Options,
  EthAddress,
  UnspawnedPoints,
} from '@urbit/roller-api';

import Point, { Points, Relationship } from './types/Point';
import { useTimerStore } from 'store/timerStore';
import { ReticketParams, SendL2Params } from './types/L2Transaction';

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
  const { pointCursor }: any = usePointCursor();
  const { web3, contracts }: any = useNetwork();
  const allPoints: any = usePointCache();
  const controlledPoints = allPoints?.controlledPoints;
  const getDetails = allPoints?.getDetails;

  const { setNextRoll } = useTimerStore();

  const {
    nextBatchTime,
    point,
    invitePoints,
    invites,
    setNextBatchTime,
    setPendingTransactions,
    setInvites,
    setInvitePoints,
    setInviteGeneratingNum,
    setPoints,
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

  const fetchConfig = useCallback(async () => {
    api
      .getRollerConfig()
      .then(response => {
        setConfig(response);
        setNextBatchTime(response.nextBatch);
      })
      .catch(err => {
        // TODO: more elegant error handling
        console.warn(
          '[fetchConfig:failed] check the roller connection?\n',
          err
        );
      });
  }, [api]); // eslint-disable-line react-hooks/exhaustive-deps

  const ls = useMemo(
    () =>
      new SecureLS({
        isCompression: false,
        encryptionSecret: authToken.getOrElse('default'),
      }),
    [authToken]
  );

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

      const starInfo = await api.getPoint(_point);
      const invites: Invite[] = [];

      const proxy = getSpawnProxy(starInfo.ownership!, _wallet.address);

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
          _web3
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
        });

        invites.push({
          hash: '',
          ticket,
          planet,
          owner: inviteWallet.ownership.keys.address,
        });
      }

      setStoredInvites(ls, invites);
    },
    [
      api,
      authToken,
      contracts,
      pointCursor,
      wallet,
      walletType,
      web3,
      getDetails,
      ls,
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
      const curPoint = Number(need.point(pointCursor));
      const newPending = await api.getPendingByShip(curPoint);

      setPendingTransactions(newPending);
    } catch (error) {
      console.warn('ERROR GETTING PENDING', error);
    }
  }, [api, setPendingTransactions, pointCursor]);

  const generateInviteInfo = async (planet: number, _authToken: string) => {
    const { ticket, inviteWallet } = await generateInviteWallet(
      planet,
      _authToken
    );

    return inviteTemplate(planet, ticket, inviteWallet.ownership.keys.address);
  };

  const getInvites = useCallback(
    async (isL2: boolean, getAll = false) => {
      try {
        const curPoint: number = Number(need.point(pointCursor));
        setInvites(invitePoints.map(p => inviteTemplate(p)));

        const _authToken = authToken.getOrElse(null);
        const _contracts = contracts.getOrElse(null);

        if (_authToken && _contracts) {
          const spawnedPoints = isL2 ? await api.getSpawned(curPoint) : [];

          const availablePoints = await azimuth.azimuth.getUnspawnedChildren(
            _contracts,
            curPoint
          );

          const outgoingPoints = getOutgoingPoints(
            controlledPoints,
            getDetails
          ).filter((p: number) => isPlanet(p) && availablePoints.includes(p));

          const invitePlanets = spawnedPoints.concat(
            outgoingPoints.filter((p: number) => !spawnedPoints.includes(p))
          );

          const newInvites: Invite[] = [];
          // Iterate over all of the stored invites, generating wallet info as necessary
          const storedInvites = getStoredInvites(ls);

          for (let i = 0; i < invitePlanets.length; i++) {
            setInviteGeneratingNum(i + 1);
            const planet = invitePlanets[i];
            const invite = storedInvites[planet];

            if (invite?.ticket) {
              newInvites.push(invite);
            } else if (getAll) {
              if (isDevelopment) {
                console.log('MISSING INVITE INFO', planet);
              }
              const newInvite = await generateInviteInfo(planet, _authToken);
              newInvites.push(newInvite);
            } else {
              newInvites.push(inviteTemplate(planet));
            }
          }

          setStoredInvites(ls, newInvites);
          setInvites(newInvites);

          return newInvites;
        }
      } catch (error) {
        console.warn('ERROR GETTING INVITES', error);
      }
    },
    [
      api,
      authToken,
      contracts,
      controlledPoints,
      getDetails,
      pointCursor,
      invitePoints,
      ls,
      setInvites,
      setInviteGeneratingNum,
    ]
  );

  const showInvite = useCallback(
    async (planet: number) => {
      const _authToken = authToken.getOrElse(null);

      if (_authToken) {
        const newInvite = await generateInviteInfo(planet, _authToken);
        const newInvites = invites.map(invite =>
          invite.planet === planet ? newInvite : invite
        );
        setInvites(newInvites);
        setStoredInvites(ls, newInvites);
      }
    },
    [authToken, invites, ls, setInvites]
  );

  const getNumInvites = useCallback(
    async (isL2: boolean) => {
      try {
        const curPoint: number = Number(need.point(pointCursor));
        const _authToken = authToken.getOrElse(null);
        const _contracts = contracts.getOrElse(null);

        if (_authToken && _contracts) {
          let spawnedPoints = isL2 ? await api.getSpawned(curPoint) : [];

          const availablePoints = await azimuth.azimuth.getUnspawnedChildren(
            _contracts,
            curPoint
          );

          const newPending = await api.getPendingByShip(curPoint);
          const pendingSpawns = getPendingSpawns(newPending);

          const outgoingPoints = getOutgoingPoints(
            controlledPoints,
            getDetails
          ).filter((p: number) => isPlanet(p) && availablePoints.includes(p));

          const invitePoints = spawnedPoints
            .concat(
              outgoingPoints.filter((p: number) => !spawnedPoints.includes(p))
            )
            .filter((p: number) => !pendingSpawns.has(p));

          setPendingTransactions(newPending);
          setInvitePoints(invitePoints);

          return invitePoints;
        }
      } catch (e) {
        if (isDevelopment) {
          console.warn(e);
        }
      }
    },
    [
      api,
      pointCursor,
      authToken,
      contracts,
      controlledPoints,
      getDetails,
      setInvitePoints,
      setPendingTransactions,
    ]
  );

  interface ConfigureKeysParams {
    breach: boolean;
    customNetworkSeed?: string;
  }

  const configureNetworkingKeys = async ({
    breach,
    customNetworkSeed,
  }: ConfigureKeysParams) => {
    const _point = need.point(pointCursor);
    const azimuthPoint = await api.getPoint(_point);
    const _wallet = wallet.getOrElse(null);
    const _web3 = web3.getOrElse(null);
    const _details = getDetails(_point);
    if (!_wallet || !_details || !_web3) {
      // not using need because we want a custom error
      throw new Error('Internal Error: Missing Wallet/Details');
    }

    const proxy = getManagerProxy(azimuthPoint.ownership!, _wallet.address);

    if (proxy === undefined)
      throw new Error("Error: Address doesn't match proxy");

    const nonce = await api.getNonce({
      ship: _point,
      proxy,
    });

    const networkRevision = convertToInt(azimuthPoint.network.keys.life, 10);
    const nextRevision = networkRevision + 1;
    const networkSeed = customNetworkSeed
      ? customNetworkSeed
      : await attemptNetworkSeedDerivation({
          urbitWallet,
          wallet,
          authMnemonic,
          details: _details,
          point: _point,
          authToken,
          revision: nextRevision,
        });
    const txHash = await submitL2Transaction({
      api,
      wallet: _wallet,
      ship: _point,
      proxy: proxy!,
      nonce,
      networkSeed,
      type: 'configureKeys',
      walletType,
      web3: _web3,
      breach,
    });
    const pendingTx = await api.getPendingTx(txHash);

    return pendingTx;
  };

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
      _web3
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
        _web3
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
    });
    requests.push(transferTxRequest);

    const hashes = await Promise.all(requests);
    return hashes;
  };

  const setProxyAddress = useCallback(
    async (proxyType: Proxy, address: EthAddress) => {
      const _point = need.point(pointCursor);
      const _wallet = wallet.getOrElse(null);
      const _web3 = web3.getOrElse(null);

      if (!_wallet) {
        // not using need because we want a custom error
        throw new Error('Internal Error: Missing Wallet');
      }

      const pointDetails = await api.getPoint(_point);
      const ownership = pointDetails.ownership!;
      const proxy = getAddressProxy(ownership, _wallet.address, proxyType);

      if (proxy === undefined)
        throw new Error("Error: Address doesn't match expected proxy");

      const nonce = await api.getNonce({ ship: _point, proxy });

      const txHash = await registerProxyAddress(
        api,
        _wallet,
        _point,
        proxy,
        proxyType,
        nonce,
        address,
        walletType,
        _web3
      );

      const pendingTx = await api.getPendingTx(txHash);

      return pendingTx;
    },
    [api, pointCursor, wallet, web3, walletType]
  );

  const adoptPoint = useCallback(
    async (point: Ship) => {
      const sponsor = need.point(pointCursor);
      const _wallet = wallet.getOrElse(null);

      const sponsorInfo = await api.getPoint(sponsor);
      const ownership = sponsorInfo.ownership!;
      const proxy = getManagerProxy(ownership, _wallet.address);

      if (proxy === undefined)
        throw new Error("Error: Address doesn't match expected proxy");

      const nonce = await api.getNonce({ ship: sponsor, proxy });
      const txHash = await adopt(api, _wallet, sponsor, proxy, nonce, point);
      const pendingTx = await api.getPendingTx(txHash);

      return pendingTx;
    },
    [api, pointCursor, wallet]
  );

  const kickPoint = useCallback(
    async (point: Ship) => {
      const sponsor = need.point(pointCursor);
      const _wallet = wallet.getOrElse(null);

      const sponsorInfo = await api.getPoint(sponsor);
      const ownership = sponsorInfo.ownership!;
      const proxy = getManagerProxy(ownership, _wallet.address);

      if (proxy === undefined)
        throw new Error("Error: Address doesn't match expected proxy");

      const nonce = await api.getNonce({ ship: sponsor, proxy });
      const txHash = await detach(api, _wallet, sponsor, proxy, nonce, point);
      const pendingTx = await api.getPendingTx(txHash);

      return pendingTx;
    },
    [api, pointCursor, wallet]
  );

  const rejectPoint = useCallback(
    async (point: Ship) => {
      const sponsor = need.point(pointCursor);
      const _wallet = wallet.getOrElse(null);

      const sponsorInfo = await api.getPoint(sponsor);
      const ownership = sponsorInfo.ownership!;
      const proxy = getManagerProxy(ownership, _wallet.address);

      if (proxy === undefined)
        throw new Error("Error: Address doesn't match expected proxy");

      const nonce = await api.getNonce({ ship: sponsor, proxy });
      const txHash = await reject(api, _wallet, sponsor, proxy, nonce, point);
      const pendingTx = await api.getPendingTx(txHash);

      return pendingTx;
    },
    [api, pointCursor, wallet]
  );

  const transferPoint = useCallback(
    async (address: EthAddress, reset?: boolean) => {
      const _point = need.point(pointCursor);
      const _wallet = wallet.getOrElse(null);
      const _web3 = web3.getOrElse(null);

      if (!_wallet) {
        // not using need because we want a custom error
        throw new Error('Internal Error: Missing Wallet');
      }

      const pointDetails = await api.getPoint(_point);
      const proxy = getTransferProxy(pointDetails.ownership!, _wallet.address);

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
        reset,
      });

      const pendingTx = await api.getPendingTx(txHash);

      return pendingTx;
    },
    [api, pointCursor, wallet, web3, walletType]
  );

  const sendL2Transaction = useCallback(
    async (params: SendL2Params) => {
      const _point = need.point(pointCursor);
      const _wallet = wallet.getOrElse(null);
      const _web3 = web3.getOrElse(null);

      if (!_wallet) {
        // not using need because we want a custom error
        throw new Error('Internal Error: Missing Wallet');
      }

      return submitL2Transaction({
        ...params,
        api,
        wallet: _wallet,
        walletType,
        web3: _web3,
        ship: _point,
      });
    },
    [api, pointCursor, wallet, web3, walletType]
  );

  const changeSponsor = useCallback(
    async (newSponsor: number) => {
      const _wallet = wallet.getOrElse(null);
      const _point = need.point(pointCursor);

      if (!_wallet) {
        // not using need because we want a custom error
        throw new Error('Internal Error: Missing Wallet');
      }

      const pointDetails = await api.getPoint(_point);
      const proxy = getManagerProxy(pointDetails.ownership!, _wallet.address);

      if (proxy === undefined)
        throw new Error("Error: Address doesn't match proxy");

      const nonce = await api.getNonce({ ship: _point, proxy });

      sendL2Transaction({
        newSponsor,
        nonce,
        proxy,
        type: 'escape',
        ship: _point,
      });
    },
    [api, sendL2Transaction, wallet, pointCursor]
  );

  const initPoint = useCallback(
    (relationship: Relationship) => async (point: string | number) => {
      const _wallet = wallet.getOrElse(null);

      if (!_wallet) {
        return EMPTY_POINT;
      }
      try {
        const pointNum = Number(point);
        const rawDetails = await api.getPoint(pointNum);
        const details = toL1Details(rawDetails);

        return new Point(pointNum, relationship, details, _wallet.address);
      } catch (e) {
        console.warn(e);
      }
    },
    [api, wallet]
  );

  const getPointDetails = useCallback(
    async (
      ownedPoints: number[],
      incomingPoints: number[],
      managingPoints: number[],
      votingPoints: number[],
      spawningPoints: number[]
    ) => {
      try {
        const allPoints = [
          await Promise.all(ownedPoints.map(initPoint(Relationship.own))),
          await Promise.all(
            incomingPoints.map(initPoint(Relationship.transfer))
          ),
          await Promise.all(managingPoints.map(initPoint(Relationship.manage))),
          await Promise.all(votingPoints.map(initPoint(Relationship.vote))),
          await Promise.all(spawningPoints.map(initPoint(Relationship.spawn))),
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
    const interval = setInterval(() => {
      const nextRoll = getTimeToNextBatch(nextBatchTime, new Date().getTime());
      setNextRoll(nextRoll);

      if (nextBatchTime - ONE_SECOND <= new Date().getTime()) {
        api.getRollerConfig().then(response => {
          setNextBatchTime(response.nextBatch);
          getNumInvites(!!point?.isL2);
        });
      }
    }, 10000000);

    return () => clearInterval(interval);
  }, [nextBatchTime, getPendingTransactions, point]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    adoptPoint,
    api,
    changeSponsor,
    config,
    configureNetworkingKeys,
    getInvites,
    getNumInvites,
    getPoints,
    getPointDetails,
    getPendingTransactions,
    generateInviteCodes,
    kickPoint,
    rejectPoint,
    transferPoint,
    ls,
    performL2Reticket,
    setProxyAddress,
    showInvite,
  };
}
