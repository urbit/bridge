import { useCallback, useEffect, useMemo, useState } from 'react';
import * as azimuth from 'azimuth-js';
import * as need from 'lib/need';
import SecureLS from 'secure-ls';

import { Invite } from 'lib/types/Invite';
import { convertToInt } from './convertToInt';
import { isDevelopment, isRopsten } from './flags';
import { generateInviteWallet, getPendingSpawns } from './utils/roller';
import { ROLLER_HOSTS } from './constants';

import { useNetwork } from 'store/network';
import { usePointCursor } from 'store/pointCursor';
import { useRollerStore } from 'store/roller';
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
} from '@urbit/roller-api';

import {
  configureKeys,
  getTimeToNextBatch,
  spawn,
  transferPointRequest,
  registerProxyAddress,
} from './utils/roller';

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

  const {
    nextBatchTime,
    currentL2,
    invitePoints,
    invites,
    setNextBatchTime,
    setNextRoll,
    setPendingTransactions,
    setInvites,
    setInvitePoints,
    setInviteGeneratingNum,
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
      const requests: Promise<string>[] = [];

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

        const spawnRequest = spawn(
          api,
          _wallet,
          _point,
          proxy,
          nonceInc,
          planet,
          walletType,
          _web3
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
          networkSeed,
          walletType,
          _web3
        );

        const setManagementProxyRequest = registerProxyAddress(
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

        const transferRequest = transferPointRequest(
          api,
          _wallet,
          planet,
          'own',
          2,
          inviteWallet.ownership.keys.address,
          walletType,
          _web3
        );

        requests.push(
          spawnRequest,
          configureKeysRequest,
          setManagementProxyRequest,
          transferRequest
        );
        await Promise.all(requests);

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
    const txHash = await configureKeys(
      api,
      _wallet,
      _point,
      proxy!,
      nonce,
      networkSeed,
      walletType,
      _web3,
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
    const configureKeysRequest = await configureKeys(
      api,
      fromWallet,
      point,
      proxy,
      nonce,
      networkSeed,
      walletType,
      _web3
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
    const transferTxRequest = await transferPointRequest(
      api,
      fromWallet,
      point,
      proxy,
      nonce,
      to,
      walletType,
      _web3
    );
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

      const txHash = await transferPointRequest(
        api,
        _wallet,
        _point,
        proxy,
        nonce,
        address,
        walletType,
        _web3,
        reset || false
      );
      const pendingTx = await api.getPendingTx(txHash);

      return pendingTx;
    },
    [api, pointCursor, wallet, web3, walletType]
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
          getNumInvites(currentL2);
        });
      }
    }, 10000000);

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
    getNumInvites,
    showInvite,
    ls,
  };
}
