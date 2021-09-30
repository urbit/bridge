import { useCallback, useEffect, useMemo, useState } from 'react';
import _ from 'lodash';
import * as azimuth from 'azimuth-js';
import * as need from 'lib/need';
import * as ob from 'urbit-ob';
import { Just } from 'folktale/maybe';

import { Invite } from 'lib/types/Invite';
import { convertToInt } from './convertToInt';
import { isDevelopment, isRopsten } from './flags';
import { hasPoint, generateInviteWallet } from './utils/roller';
import { ROLLER_HOSTS } from './constants';

import { useNetwork } from 'store/network';
import { usePointCursor } from 'store/pointCursor';
import { useRollerStore } from 'store/roller';
import { useWallet } from 'store/wallet';
import {
  getStoredInvites,
  setPendingInvites,
  setStoredInvites,
} from 'store/storage/roller';
import { usePointCache } from 'store/pointCache';
import { getOutgoingPoints } from 'views/Points';
import {
  isManagementProxy,
  isOwnerProxy,
  isTransferProxy,
  isSpawnProxy,
} from './utils/proxy';
import { isPlanet } from './utils/point';

import {
  deriveNetworkSeedFromUrbitWallet,
  attemptNetworkSeedDerivation,
} from 'lib/keys';

import {
  Config,
  Ship,
  Proxy,
  RollerRPCAPI,
  Options,
  EthAddress,
  UnspawnedPoints,
  SpawnParams,
  L2Data,
} from '@urbit/roller-api';

import {
  configureKeys,
  getTimeToNextBatch,
  spawn,
  transferPointRequest,
  registerProxyAddress,
} from './utils/roller';

function isSpawn(tx: L2Data | undefined): tx is SpawnParams {
  return (tx as SpawnParams) !== undefined;
}

function isShipNumber(ship: number | string | undefined): ship is number {
  return (ship as number) !== undefined;
}

export default function useRoller() {
  const { wallet, authToken, authMnemonic, urbitWallet }: any = useWallet();
  const { pointCursor }: any = usePointCursor();
  const { web3, contracts }: any = useNetwork();
  const allPoints: any = usePointCache();
  const controlledPoints = allPoints?.controlledPoints;
  const getDetails = allPoints?.getDetails;

  const {
    nextBatchTime,
    setNextBatchTime,
    setNextRoll,
    setPendingTransactions,
    setInvites,
    currentL2,
  } = useRollerStore();
  const [config, setConfig] = useState<Config | null>(null);

  const options: Options = useMemo(() => {
    const type = isRopsten || !isDevelopment ? 'https' : 'http';
    const host = isRopsten
      ? ROLLER_HOSTS.ROPSTEN
      : isDevelopment
      ? ROLLER_HOSTS.LOCAL
      : ROLLER_HOSTS.MAINNET;
    const port = isRopsten ? 443 : 8080;
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

      if (Just.hasInstance(authMnemonic)) {
        throw new Error(
          "Auth key Error: A management mnemonic can't create invite codes"
        );
      }
      let planets: UnspawnedPoints = await api.getUnspawned(_point);

      const pendingTxs = await api.getPendingByShip(_point);

      const pendingSpawns = _.reduce(
        pendingTxs,
        (acc, pending) => {
          return isSpawn(pending.rawTx?.tx) &&
            isShipNumber(pending.rawTx?.tx.data.ship)
            ? acc.add(pending.rawTx?.tx.data.ship!)
            : acc;
        },
        new Set<number>()
      );

      planets = planets.filter((point: number) => !pendingSpawns.has(point));

      const starInfo = await api.getPoint(_point);
      const tickets: {
        ticket: string;
        planet: number;
        owner: string;
      }[] = [];
      const requests: Promise<string>[] = [];

      const proxy = isOwnerProxy(starInfo.ownership!, _wallet.address)
        ? 'own'
        : isSpawnProxy(starInfo.ownership!, _wallet.address)
        ? 'spawn'
        : undefined;

      if (proxy === undefined)
        throw new Error("Error: Address doesn't match proxy");

      const nonce = await api.getNonce({
        ship: _point,
        proxy,
      });

      for (let i = 0; i < numInvites && planets[i]; i++) {
        const planet = planets[i];
        const nonceInc = i + nonce;

        const { ticket, inviteWallet } = await generateInviteWallet(
          planet,
          _authToken
        );

        const spawnRequest = spawn(
          api,
          _wallet,
          _point,
          proxy,
          nonceInc,
          planet
        );

        const networkSeed = await deriveNetworkSeedFromUrbitWallet(
          inviteWallet,
          1
        );
        const configureKeysRequest = configureKeys(
          api,
          _wallet,
          planet,
          'own',
          0,
          networkSeed
        );

        const setManagementProxyRequest = registerProxyAddress(
          api,
          _wallet,
          planet,
          'own',
          'manage',
          1,
          inviteWallet.management.keys.address
        );

        const transferRequest = transferPointRequest(
          api,
          _wallet,
          planet,
          'own',
          2,
          inviteWallet.ownership.keys.address
        );

        requests.push(
          spawnRequest,
          configureKeysRequest,
          setManagementProxyRequest,
          transferRequest
        );
        tickets.push({
          ticket,
          planet,
          owner: inviteWallet.ownership.keys.address,
        });
      }

      const hashes = await Promise.all(requests);

      const pendingInvites: Invite[] = tickets.map((ticket, ind) => ({
        ...ticket,
        hash: hashes[ind * 3 + 2],
        status: 'pending',
      }));

      setPendingInvites(_point, pendingInvites);
    },
    [
      api,
      authToken,
      contracts,
      pointCursor,
      wallet,
      web3,
      getDetails,
      authMnemonic,
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

      // const allTransactions = await api.getHistory()
    } catch (error) {
      console.warn('ERROR GETTING PENDING', error);
    }
  }, [api, setPendingTransactions, pointCursor]);

  const getInvites = useCallback(
    async (isL2: boolean) => {
      try {
        const curPoint: number = Number(need.point(pointCursor));
        const invites = getStoredInvites(curPoint);
        const availableInvites = invites.available;
        const pendingTransactions = await api.getPendingByShip(curPoint);
        if (isDevelopment) {
          console.log('PENDING', pendingTransactions);
        }
        setPendingTransactions(pendingTransactions);

        const stillPending = invites.pending.filter(invite => {
          const completed = !pendingTransactions.find(
            p => `~${p?.rawTx?.tx?.data?.ship}` === ob.patp(invite.planet)
          );

          if (
            completed &&
            !availableInvites.find(({ planet }) => invite.planet === planet)
          ) {
            availableInvites.push({ ...invite, status: 'available' });
          }

          return !completed;
        });

        setStoredInvites(curPoint, {
          available: availableInvites,
          pending: stillPending,
        });
        setInvites(availableInvites);

        const _authToken = authToken.getOrElse(null);
        const _contracts = contracts.getOrElse(null);

        if (_authToken && _contracts) {
          let possibleMissingInvites: number[] = [];
          let availablePoints: number[] = [];
          if (isL2) {
            possibleMissingInvites = await api.getSpawned(curPoint);
            availablePoints = await api.getUnspawned(curPoint);
          } else {
            // TODO: should it be removed?
            availablePoints = await azimuth.azimuth.getUnspawnedChildren(
              _contracts,
              curPoint
            );
          }

          const outgoingPoints = getOutgoingPoints(
            controlledPoints,
            getDetails
          );

          possibleMissingInvites = possibleMissingInvites.concat(
            outgoingPoints.filter(
              (p: number) => isPlanet(p) && availablePoints.includes(p)
            )
          );

          // Iterate over all spawned and controlled planets
          // If the planet is not in available invites, generate the ticket and add it
          if (isDevelopment) {
            console.log('POSSIBLE MISSING', possibleMissingInvites);
          }
          // TODO: this can be verym slow, so best to allow the user to manually
          // reveal the ticket, after checking if the invite is still "active"
          // (i.e. if the address inferred from the derived inviteWallet corresponds to
          // to the address the point has as owner)
          //
          for (let i = 0; i < possibleMissingInvites.length; i++) {
            const planet = possibleMissingInvites[i];
            if (!availableInvites.find(hasPoint(planet))) {
              console.log('MISSING IN AVAILABLE', planet);
              const { ticket, inviteWallet } = await generateInviteWallet(
                planet,
                _authToken
              );

              availableInvites.push({
                ticket,
                status: 'available',
                planet,
                hash: '',
                owner: inviteWallet.ownership.keys.address,
              });
            }
          }

          setStoredInvites(curPoint, {
            available: availableInvites.filter(({ planet }) =>
              possibleMissingInvites.includes(planet)
            ),
            pending: stillPending,
          });
          setInvites(availableInvites);
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
      setInvites,
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
    const _details = getDetails(_point);
    if (!_wallet || !_details) {
      // not using need because we want a custom error
      throw new Error('Internal Error: Missing Wallet/Details');
    }

    const pointDetails = await api.getPoint(_point);
    // const proxy = getProxy(pointDetails.ownership!, _wallet.address);
    const proxy = isOwnerProxy(pointDetails.ownership!, _wallet.address)
      ? 'own'
      : isManagementProxy(pointDetails.ownership!, _wallet.address)
      ? 'manage'
      : undefined;

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
    const txHash = await configureKeys(
      api,
      _wallet,
      _point,
      proxy!,
      nonce,
      networkSeed,
      breach
    );
    const pendingTx = await api.getPendingTx(txHash);

    return pendingTx;
  };

  interface ReticketParams {
    point: Ship;
    to: EthAddress;
    manager: EthAddress;
    fromWallet: any; // TODO: wallet type
    toWallet: any; // TODO: wallet type
  }

  const performL2Reticket = async ({
    point,
    to,
    manager,
    fromWallet,
    toWallet,
  }: ReticketParams) => {
    const azimuthPoint = await api.getPoint(point);
    const proxy = 'own';
    let nonce = await api.getNonce({ ship: point, proxy });

    let requests = [];

    // 1. Update networking keys
    const networkRevision = convertToInt(azimuthPoint.network.keys.life, 10);
    const nextRevision = networkRevision + 1;
    const networkSeed = await deriveNetworkSeedFromUrbitWallet(
      toWallet,
      nextRevision
    );
    const configureKeysRequest = await configureKeys(
      api,
      fromWallet,
      point,
      proxy,
      nonce,
      networkSeed
    );
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
      manager
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
        toWallet.spawn.keys.address
      );
      nonce = nonce + 1;
      requests.push(registerSpawnRequest);
    }
    // 4. Transfer point
    const transferTxRequest = await transferPointRequest(
      api,
      fromWallet,
      point,
      proxy,
      nonce,
      to
    );
    requests.push(transferTxRequest);

    const hashes = await Promise.all(requests);
    return hashes;
  };

  const setProxyAddress = useCallback(
    async (proxyType: Proxy, address: EthAddress) => {
      const _point = need.point(pointCursor);
      const _wallet = wallet.getOrElse(null);

      if (!_wallet) {
        // not using need because we want a custom error
        throw new Error('Internal Error: Missing Wallet');
      }

      const pointDetails = await api.getPoint(_point);
      const ownership = pointDetails.ownership!;
      const proxy = isOwnerProxy(ownership, _wallet.address)
        ? 'own'
        : proxyType === 'manage' &&
          isManagementProxy(ownership, _wallet.address)
        ? 'manage'
        : proxyType === 'spawn' && isSpawnProxy(ownership, _wallet.address)
        ? 'spawn'
        : proxyType === 'transfer' &&
          isTransferProxy(ownership, _wallet.address)
        ? 'transfer'
        : undefined;

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
        address
      );

      const pendingTx = await api.getPendingTx(txHash);

      return pendingTx;
    },
    [api, pointCursor, wallet]
  );

  const transferPoint = useCallback(
    async (address: EthAddress, reset?: boolean) => {
      const _point = need.point(pointCursor);
      const _wallet = wallet.getOrElse(null);

      if (!_wallet) {
        // not using need because we want a custom error
        throw new Error('Internal Error: Missing Wallet');
      }

      const pointDetails = await api.getPoint(_point);
      const proxy = isOwnerProxy(pointDetails.ownership!, _wallet.address)
        ? 'own'
        : isTransferProxy(pointDetails.ownership!, _wallet.address)
        ? 'transfer'
        : undefined;

      if (proxy === undefined)
        throw new Error("Error: Address doesn't match proxy");

      const nonce = await api.getNonce({ ship: _point, proxy });

      const txHash = await transferPointRequest(
        api,
        _wallet,
        _point,
        proxy,
        nonce,
        address,
        reset || false
      );
      const pendingTx = await api.getPendingTx(txHash);

      return pendingTx;
    },
    [api, pointCursor, wallet]
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

      if (nextBatchTime <= new Date().getTime()) {
        api.getRollerConfig().then(response => {
          setNextBatchTime(response.nextBatch);
        });

        getInvites(currentL2);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [nextBatchTime, getPendingTransactions, currentL2]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    api,
    performL2Reticket,
    config,
    getPoints,
    getInvites,
    getPendingTransactions,
    generateInviteCodes,
    transferPoint,
    setProxyAddress,
    configureNetworkingKeys,
  };
}
