import { useCallback, useEffect, useMemo, useState } from 'react';
import * as wg from 'lib/walletgen';
import * as need from 'lib/need';
import * as azimuth from 'azimuth-js';
import * as ob from 'urbit-ob';
import { Just } from 'folktale/maybe';
import { randomHex } from 'web3-utils';

import {
  attemptNetworkSeedDerivation,
  deriveNetworkKeys,
  CRYPTO_SUITE_VERSION,
} from 'lib/keys';
import { addHexPrefix } from 'lib/utils/address';

import {
  Config,
  Ship,
  L2Point,
  Proxy,
  RollerRPCAPI,
  Options,
  EthAddress,
  UnspawnedPoints,
  Hash,
  Signature,
  From,
  AddressParams,
} from '@urbit/roller-api';

import { isDevelopment, isRopsten } from './flags';
import { ROLLER_HOSTS } from './constants';
import { useRollerStore } from 'store/roller';
import { getTimeToNextBatch } from './utils/roller';
import { useWallet } from 'store/wallet';
import { usePointCursor } from 'store/pointCursor';
import { useNetwork } from 'store/network';
import { signTransactionHash } from './authToken';
import { Invite } from 'lib/types/Invite';
import {
  getStoredInvites,
  setPendingInvites,
  setStoredInvites,
} from 'store/storage/roller';
import { usePointCache } from 'store/pointCache';
import { getOutgoingPoints, maybeGetResult } from 'views/Points';
import { isPlanet, getProxyAndNonce } from './utils/point';

const spawn = async (
  api: any,
  _wallet: any,
  _point: number,
  proxy: string,
  nonce: number,
  planet: number
) => {
  const from = {
    ship: _point, //ship that is spawning the planet
    proxy,
  };

  const data = {
    address: _wallet.address,
    ship: planet, // ship to spawn
  };

  const hash = await api.hashTransaction(nonce, from, 'spawn', data);
  const sSig = signTransactionHash(hash, _wallet.privateKey);
  return api.spawn(sSig, from, _wallet.address, data);
};

const configureKeys = async (
  api: any,
  _wallet: any,
  _point: number,
  proxy: string,
  nonce: number,
  details: any,
  authToken: string,
  authMnemonic: string,
  wallet: any,
  urbitWallet: any
) => {
  const from = {
    ship: _point, //ship that is spawning the planet
    proxy,
  };

  const networkSeed = await attemptNetworkSeedDerivation({
    urbitWallet,
    wallet,
    authMnemonic,
    details,
    point: _point,
    authToken,
    revision: 1,
  });

  const seed = Just.hasInstance(networkSeed)
    ? networkSeed.value
    : randomHex(32);

  const pair = deriveNetworkKeys(seed);

  const data = {
    encrypt: addHexPrefix(pair.crypt.public),
    auth: addHexPrefix(pair.auth.public),
    cryptoSuite: String(CRYPTO_SUITE_VERSION),
    breach: false,
  };

  const hash = await api.hashTransaction(nonce, from, 'configureKeys', data);
  const sig = signTransactionHash(hash, _wallet.privateKey);
  return api.configureKeys(sig, from, _wallet.address, data);
};

const transferPoint = async (
  api: any,
  _wallet: any,
  _point: number,
  proxy: string,
  nonce: number,
  address: string
) => {
  const from = {
    ship: _point, //ship that is spawning the planet
    proxy,
  };

  const data = {
    address,
    reset: false,
  };

  const hash = await api.hashTransaction(nonce, from, 'transferPoint', data);
  const sig = signTransactionHash(hash, _wallet.privateKey);
  return api.transferPoint(sig, from, _wallet.address, data);
};

const hashProxyTx = async (
  api: any,
  proxy: Proxy,
  nonce: number,
  from: From,
  data: AddressParams
) => {
  switch (proxy) {
    case 'manage':
      return await api.hashTransaction(nonce, from, 'setManagementProxy', data);
    case 'spawn':
      return await api.hashTransaction(nonce, from, 'setSpawnProxy', data);
    case 'transfer':
      return await api.hashTransaction(nonce, from, 'setTrasferProxy', data);
    default:
      throw new Error(`Unknown proxyType ${proxy}`);
  }
};

const setProxy = async (
  api: any,
  proxy: Proxy,
  sig: Signature,
  from: From,
  address: EthAddress,
  data: AddressParams
) => {
  switch (proxy) {
    case 'manage':
      return await api.setManagementProxy(sig, from, address, data);
    case 'spawn':
      return await api.setSpawnProxy(sig, from, address, data);
    case 'transfer':
      return await api.setTrasferProxy(sig, from, address, data);
    default:
      throw new Error(`Unknown proxyType ${proxy}`);
  }
};

const hasPoint = (point: number) => (invite: Invite) => invite.planet === point;

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
    currentNonce,
    increaseNonce,
  } = useRollerStore();
  const [config, setConfig] = useState<Config | null>(null);

  const options: Options = useMemo(() => {
    const type = isRopsten || !isDevelopment ? 'https' : 'http';
    const host = isRopsten
      ? ROLLER_HOSTS.ROPSTEN
      : isDevelopment
      ? ROLLER_HOSTS.LOCAL
      : ROLLER_HOSTS.MAINNET;
    const port = isDevelopment ? 8080 : 80;
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
          '[fetchConfig:failed] is roller running on localhost?\n',
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

      const planets: UnspawnedPoints = await api.getUnspawned(_point);
      const starInfo = await api.getPoint(_point);

      const tickets: { ticket: string; planet: number; owner: string }[] = [];
      const requests: Promise<string>[] = [];

      const { proxy } = getProxyAndNonce(starInfo, _wallet.address);

      if (!(proxy === 'own' || proxy === 'spawn'))
        throw new Error("Error: Address doesn't match proxy");

      for (let i = 0; i < numInvites && planets[i]; i++) {
        const planet = planets[i];
        const nonceInc = i * 3;

        const { ticket, owner } = await wg.generateTemporaryDeterministicWallet(
          planet,
          _authToken
        );

        const spawnRequest = await spawn(
          api,
          _wallet,
          _point,
          proxy,
          nonceInc,
          planet
        );

        const configureKeysRequest = await configureKeys(
          api,
          _wallet,
          _point,
          proxy,
          nonceInc + 1,
          _details,
          authToken,
          authMnemonic,
          wallet,
          urbitWallet
        );

        const transferPointRequest = await transferPoint(
          api,
          _wallet,
          _point,
          proxy,
          nonceInc + 2,
          owner.keys.address
        );

        requests.push(spawnRequest, configureKeysRequest, transferPointRequest);
        tickets.push({
          ticket,
          planet,
          owner: owner.keys.address,
        });
      }

      const hashes = await Promise.all(requests);

      const pendingInvites = tickets.map((ticket, ind) => ({
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
      // walletHdPath,
      // walletType,
      web3,
      getDetails,
      authMnemonic,
      urbitWallet,
    ]
  );

  const getPoints = useCallback(
    async (proxy: Proxy, address: EthAddress) => {
      const points: Ship[] =
        proxy === 'own'
          ? await api.getOwnedPoints(address)
          : proxy === 'mange'
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
            p => `~${p?.rawTx?.tx?.tx?.data?.ship}` === ob.patp(invite.planet)
          );

          if (
            completed &&
            !availableInvites.find(({ ship }) => invite.ship === ship)
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
          if (isL2) {
            const allSpawned = await api.getSpawned(curPoint);
            const ownedPoints = maybeGetResult(
              controlledPoints,
              'ownedPoints',
              []
            );
            possibleMissingInvites = allSpawned.filter(
              (p: number) => ownedPoints.includes(p) && isPlanet(p)
            );
          }

          const outgoingPoints = getOutgoingPoints(
            controlledPoints,
            getDetails
          );

          const availablePoints = await azimuth.azimuth.getUnspawnedChildren(
            _contracts,
            curPoint
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

          for (let i = 0; i < possibleMissingInvites.length; i++) {
            const planet = possibleMissingInvites[i];

            if (
              !availableInvites.find(hasPoint(planet)) &&
              !(await azimuth.azimuth.isActive(_contracts, planet))
            ) {
              console.log('MISSING IN AVAILABLE', planet);
              const {
                ticket,
                owner,
              } = await wg.generateTemporaryDeterministicWallet(
                planet,
                _authToken
              );

              availableInvites.push({
                ticket,
                status: 'available',
                planet,
                hash: '',
                owner: owner.keys.address,
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
      pointCursor,
      setInvites,
      setPendingTransactions,
      authToken,
      contracts,
      controlledPoints,
      getDetails,
    ]
  );

  const setProxyAddress = useCallback(
    async (proxyType: Proxy, address: EthAddress) => {
      console.log(proxyType, address);
      const _point = need.point(pointCursor);
      const _wallet = wallet.getOrElse(null);
      // const _details = getDetails(_point);
      if (!_wallet) {
        // not using need because we want a custom error
        throw new Error('Internal Error: Missing Wallet');
      }

      const pointDetails = await api.getPoint(_point);
      // TODO: replace with call to useNonce() store
      const { proxy } = getProxyAndNonce(pointDetails, _wallet.address);
      console.log(nonce, pointDetails, _wallet.address);
      if (
        (proxyType !== 'spawn' &&
          proxyType !== 'manage' &&
          proxyType !== 'transfer') ||
        proxy === undefined
      )
        throw new Error("Error: Address doesn't match proxy");

      const from = {
        ship: _point,
        proxy,
      };

      const hash: Hash = await hashProxyTx(api, proxyType, currentNonce, from, {
        address,
      });

      const txHash: Hash = await setProxy(
        api,
        proxyType,
        signTransactionHash(hash, _wallet.privateKey),
        from,
        _wallet.address,
        { address }
      );

      increaseNonce();

      const pendingTx = await api.getPendingTx(txHash);

      return pendingTx;
    },
    [api, pointCursor, wallet, currentNonce, increaseNonce]
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
    config,
    getPoints,
    getInvites,
    getPendingTransactions,
    generateInviteCodes,
    setProxyAddress,
  };
}
