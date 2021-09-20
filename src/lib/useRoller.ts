import { useCallback, useEffect, useMemo, useState } from 'react';
import * as azimuth from 'azimuth-js';
import * as need from 'lib/need';
import * as ob from 'urbit-ob';
import * as wg from 'lib/walletgen';

import { addHexPrefix } from 'lib/utils/address';
import { convertToInt } from './convertToInt';
import { ensureHexPrefix } from 'form/formatters';
import { getOutgoingPoints, maybeGetResult } from 'views/Points';
import { getTimeToNextBatch } from './utils/roller';
import { Invite } from 'types/Invite';
import { isDevelopment, isRopsten } from './flags';
import { isPlanet } from './utils/point';
import { Just } from 'folktale/maybe';
import { randomHex } from 'web3-utils';
import { ROLLER_HOSTS } from './constants';
import { signTransactionHash } from './authToken';
import { useNetwork } from 'store/network';
import { usePointCache } from 'store/pointCache';
import { usePointCursor } from 'store/pointCursor';
import { useRollerStore } from 'store/roller';
import { useWallet } from 'store/wallet';

import {
  attemptNetworkSeedDerivation,
  deriveNetworkKeys,
  CRYPTO_SUITE_VERSION,
  deriveNetworkSeedFromUrbitWallet,
} from 'lib/keys';

import {
  Config,
  Ship,
  L2Point,
  Proxy,
  RollerRPCAPI,
  Options,
  EthAddress,
  UnspawnedPoints,
  From,
  Hash,
} from '@urbit/roller-api';

import {
  getStoredInvites,
  setPendingInvites,
  setStoredInvites,
} from 'store/storage/roller';

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

const hasPoint = (point: number) => (invite: Invite) => invite.planet === point;

const getProxyAndNonce = (
  point: L2Point,
  address: string
): { proxy?: string; nonce?: number } => {
  return point.ownership?.managementProxy?.address === address
    ? { proxy: 'manage', nonce: point.ownership?.managementProxy.nonce }
    : point.ownership?.owner?.address === address
    ? { proxy: 'own', nonce: point.ownership?.owner.nonce }
    : point.ownership?.spawnProxy?.address === address
    ? { proxy: 'spawn', nonce: point.ownership?.spawn?.owner.nonce }
    : point.ownership?.votingProxy?.address === address
    ? { proxy: 'vote', nonce: point.ownership?.votingProxy?.owner.nonce }
    : point.ownership?.transferProxy?.address === address
    ? {
        proxy: 'transfer',
        nonce: point.transferProxy?.votingProxy?.owner.nonce,
      }
    : { proxy: undefined, nonce: undefined };
};

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

      const planets: UnspawnedPoints = await api.getUnspawned(_point);
      const starInfo = await api.getPoint(_point);

      const tickets: { ticket: string; planet: number; owner: string }[] = [];
      const requests: Promise<string>[] = [];

      const { proxy, nonce } = getProxyAndNonce(starInfo, _wallet.address);

      if (!(proxy === 'own' || proxy === 'spawn') || nonce === undefined)
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

  // TODO: extract from #transferPoint
  // interface ConfigureKeysParams {

  // }

  // const configureKeys = async () => {

  // }

  interface AcceptInviteParams {
    point: Ship;
    to: EthAddress;
    fromWallet: any; // TODO: wallet type
    toWallet: any; // TODO: wallet type
  }

  const acceptInvite = async ({
    point,
    to,
    fromWallet,
    toWallet,
  }: AcceptInviteParams) => {
    const azimuthPoint = await api.getPoint(point);
    const spawnerPatp = ob.patp(azimuthPoint?.network?.sponsor?.who);
    console.log('azimuthPoint', azimuthPoint);
    const ownerAddress = azimuthPoint?.ownership?.owner?.address!;

    const { nonce } = getProxyAndNonce(azimuthPoint, ownerAddress);
    if (nonce === undefined) {
      throw new Error('Nonce unavailable');
    }

    // 1. Update networking keys
    // TODO: extract this to a useRoller#configureKeys function?
    const networkRevision = convertToInt(azimuthPoint.network.keys.life, 10);
    const nextRevision = networkRevision + 1;
    const fromOwnerProxy: From = {
      ship: spawnerPatp,
      proxy: 'own',
    };

    const seed = await deriveNetworkSeedFromUrbitWallet(toWallet, nextRevision);
    const keys = deriveNetworkKeys(seed.value);
    const keysData = {
      auth: ensureHexPrefix(keys.auth.public),
      breach: false,
      cryptoSuite: CRYPTO_SUITE_VERSION.toString(),
      encrypt: ensureHexPrefix(keys.crypt.public),
    };

    const keysHash: Hash = await api.hashTransaction(
      nonce,
      fromOwnerProxy,
      'configureKeys',
      keysData
    );

    const keysSigningKey = fromWallet.privateKey;
    await api.configureKeys(
      signTransactionHash(keysHash, Buffer.from(keysSigningKey, 'hex')),
      fromOwnerProxy,
      ownerAddress,
      keysData
    );

    // 2. Transfer point
    const transferData = { address: ownerAddress, reset: false };
    const transferHash: Hash = await api.hashTransaction(
      nonce + 1,
      fromOwnerProxy,
      'transferPoint',
      transferData
    );

    const transferSigningKey = toWallet.ownership.keys.private;
    const transferTxHash = await api.transferPoint(
      signTransactionHash(transferHash, Buffer.from(transferSigningKey, 'hex')),
      fromOwnerProxy,
      to,
      transferData
    );

    return transferTxHash;
  };

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
    acceptInvite,
    config,
    getPoints,
    getInvites,
    getPendingTransactions,
    generateInviteCodes,
    transferPoint,
  };
}
